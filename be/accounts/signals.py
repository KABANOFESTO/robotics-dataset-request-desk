from django.conf import settings
from django.core.management import call_command
from django.db.models.signals import post_migrate
from django.dispatch import receiver


@receiver(post_migrate, dispatch_uid="accounts.seed_configured_users")
def seed_configured_users(sender, **kwargs):
    """Optionally create configured users after migrations have completed."""
    if sender.label != "accounts" or not settings.AUTO_SEED_USERS:
        return

    call_command("seed_users", verbosity=0)
