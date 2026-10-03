import json
from pathlib import Path

from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils.crypto import get_random_string

from accounts.models import User, UserRole


DEFAULT_SEED_FILE = settings.SEED_USERS_FILE


class Command(BaseCommand):
    help = "Create missing accounts from the configured user seed data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=Path,
            help="Path to a JSON array of users (defaults to SEED_USERS_FILE).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        seed_file = options["file"] or DEFAULT_SEED_FILE
        seed_users_json = getattr(settings, "SEED_USERS_JSON", "")
        if seed_users_json and options["file"] is None:
            raw_users = seed_users_json
            source = "SEED_USERS_JSON"
        else:
            if (
                not seed_file.is_file()
                and options["file"] is None
                and settings.DEBUG
            ):
                example_file = seed_file.with_name("users.example.json")
                if example_file.is_file():
                    seed_file = example_file
            if not seed_file.is_file():
                raise CommandError(
                    f"Seed file not found: {seed_file}. Set SEED_USERS_JSON or pass --file."
                )
            try:
                raw_users = seed_file.read_text(encoding="utf-8")
            except OSError as exc:
                raise CommandError(f"Could not read seed file: {exc}") from exc
            source = str(seed_file)

        try:
            users = json.loads(raw_users)
        except json.JSONDecodeError as exc:
            raise CommandError(f"Seed data from {source} is not valid JSON: {exc}") from exc

        if not isinstance(users, list):
            raise CommandError("Seed file must contain a JSON array of users.")

        valid_roles = {role.value for role in UserRole}
        seen_emails = set()
        created = 0
        skipped = 0
        generated_credentials = []

        for index, item in enumerate(users, start=1):
            if not isinstance(item, dict):
                raise CommandError(f"Entry {index} must be a JSON object.")

            email = item.get("email", "").strip().lower()
            password = item.get("password")
            role = item.get("role")
            name = item.get("name", "").strip()

            if not email or role not in valid_roles:
                raise CommandError(
                    f"Entry {index} must have an email and valid role."
                )
            if password is not None and not isinstance(password, str):
                raise CommandError(f"Entry {index} password must be a string.")
            if not password and not settings.DEBUG:
                raise CommandError(
                    f"Entry {index} must have a password outside debug mode."
                )
            if email in seen_emails:
                raise CommandError(f"Duplicate email in seed file: {email}")
            seen_emails.add(email)

            if not settings.DEBUG and not settings.SEED_USERS_ALLOW_WEAK_PASSWORDS:
                try:
                    validate_password(password, user=User(email=email))
                except ValidationError as exc:
                    raise CommandError(
                        f"Entry {index} has a password that fails Django's password policy."
                    ) from exc

            if User.objects.filter(email__iexact=email).exists():
                skipped += 1
                continue

            if not password:
                password = get_random_string(32)
                generated_credentials.append((email, password))

            first_name, _, last_name = name.partition(" ")
            User.objects.create_user(
                email=email,
                password=password,
                role=role,
                first_name=first_name,
                last_name=last_name,
            )
            created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed complete: {created} user(s) created, {skipped} existing user(s) kept."
            )
        )
        if generated_credentials:
            self.stdout.write(
                self.style.WARNING(
                    "Generated local-only passwords. Save them now; they are not "
                    "shown again and must not be used outside local development:"
                )
            )
            for email, password in generated_credentials:
                self.stdout.write(f"{email}: {password}")
