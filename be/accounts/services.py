import logging
import string

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.utils.crypto import get_random_string
from django.utils.html import escape, format_html

from .models import User

logger = logging.getLogger(__name__)


class TemporaryPasswordEmailError(Exception):
    """Raised when an account's initial credentials cannot be emailed."""


def send_temporary_password_email(user, temporary_password):
    frontend_url = getattr(settings, "FRONTEND_URL", "http://localhost:3000").rstrip("/")
    login_url = f"{frontend_url}/login"
    display_name = user.get_full_name().strip() or user.email
    subject = "Your Dataset Request Desk account"
    text_body = (
        f"Hello {display_name},\n\n"
        "An account has been created for you in Dataset Request Desk.\n\n"
        f"Email: {user.email}\n"
        f"Temporary password: {temporary_password}\n\n"
        f"Sign in at: {login_url}\n\n"
        "If you did not expect this account, contact your workspace administrator."
    )
    html_body = format_html(
        "<p>Hello {},</p>"
        "<p>An account has been created for you in Dataset Request Desk.</p>"
        "<p><strong>Email:</strong> {}</p>"
        "<p><strong>Temporary password:</strong> <code>{}</code></p>"
        '<p><a href="{}">Sign in to Dataset Request Desk</a></p>'
        "<p>If you did not expect this account, contact your workspace administrator.</p>",
        escape(display_name),
        escape(user.email),
        escape(temporary_password),
        escape(login_url),
    )
    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    message.attach_alternative(html_body, "text/html")
    if message.send(fail_silently=False) != 1:
        raise TemporaryPasswordEmailError("The credential email was not accepted for delivery.")


@transaction.atomic
def create_user_with_temporary_password(**user_fields):
    password_alphabet = string.ascii_letters + string.digits + "!@#$%^&*()-_=+"
    temporary_password = get_random_string(24, allowed_chars=password_alphabet)
    user = User.objects.create_user(password=temporary_password, **user_fields)
    try:
        send_temporary_password_email(user, temporary_password)
    except Exception as exc:
        logger.exception(
            "Temporary-password email delivery failed for user_id=%s",
            user.pk,
        )
        raise TemporaryPasswordEmailError(
            "The account was not created because its temporary password could not be emailed."
        ) from exc
    return user
