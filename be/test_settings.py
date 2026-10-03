"""Deterministic test settings: isolated SQLite database and in-memory email."""

from be.settings import *  # noqa: F403

SECRET_KEY = "test-only-secret-key-with-at-least-32-bytes"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
