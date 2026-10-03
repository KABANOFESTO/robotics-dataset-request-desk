"""Apply local database setup before Django's development server starts."""

import os

from django.conf import settings
from django.core.management import call_command
from django.core.management.commands.runserver import Command as DjangoRunserverCommand


class Command(DjangoRunserverCommand):
    """Run idempotent migrations and seed accounts in development mode."""

    def handle(self, *args, **options):
        is_autoreload_child = os.environ.get("RUN_MAIN") == "true"
        if settings.AUTO_SETUP_ON_RUNSERVER and not is_autoreload_child:
            call_command("migrate", interactive=False, verbosity=options["verbosity"])
            call_command("seed_users", verbosity=options["verbosity"])
        return super().handle(*args, **options)
