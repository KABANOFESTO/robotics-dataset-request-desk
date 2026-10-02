import json
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from accounts.models import User, UserRole


DEFAULT_SEED_FILE = settings.BASE_DIR.parent / "seed" / "users.json"


class Command(BaseCommand):
    help = "Create any missing development accounts from seed/users.json."

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=Path,
            default=DEFAULT_SEED_FILE,
            help="Path to a JSON array of users (defaults to the repository seed file).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        seed_file = options["file"]
        if not seed_file.is_file():
            raise CommandError(f"Seed file not found: {seed_file}")

        try:
            users = json.loads(seed_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise CommandError(f"Could not read seed file: {exc}") from exc

        if not isinstance(users, list):
            raise CommandError("Seed file must contain a JSON array of users.")

        valid_roles = {role.value for role in UserRole}
        seen_emails = set()
        created = 0
        skipped = 0

        for index, item in enumerate(users, start=1):
            if not isinstance(item, dict):
                raise CommandError(f"Entry {index} must be a JSON object.")

            email = item.get("email", "").strip().lower()
            password = item.get("password")
            role = item.get("role")
            name = item.get("name", "").strip()

            if not email or not password or role not in valid_roles:
                raise CommandError(
                    f"Entry {index} must have an email, password, and valid role."
                )
            if email in seen_emails:
                raise CommandError(f"Duplicate email in seed file: {email}")
            seen_emails.add(email)

            if User.objects.filter(email__iexact=email).exists():
                skipped += 1
                continue

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
