import json
import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.urls import reverse

from test_helpers import post_json


def test_client_cannot_manage_users(auth_client):
    response = auth_client.get(reverse("user-list"))

    assert response.status_code == 403


def test_operator_cannot_manage_users(operator_client):
    response = operator_client.get(reverse("user-list"))

    assert response.status_code == 403


def test_admin_can_create_and_change_user_role(admin_client):
    response = post_json(
        admin_client,
        reverse("user-list"),
        {
            "email": "new-operator@example.com",
            "role": "operator",
        },
    )

    assert response.status_code == 201
    user_id = response.json()["id"]

    response = admin_client.patch(
        reverse("user-detail", args=[user_id]),
        data=json.dumps({"role": "client", "is_active": False}),
        content_type="application/json",
    )

    assert response.status_code == 200
    assert response.json()["role"] == "client"
    assert response.json()["is_active"] is False


def test_admin_user_creation_emails_a_random_temporary_password(admin_client):
    response = post_json(
        admin_client,
        reverse("user-list"),
        {
            "email": "emailed-user@example.com",
            "first_name": "Casey",
            "last_name": "Client",
            "role": "client",
        },
    )

    assert response.status_code == 201
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["emailed-user@example.com"]
    password_match = re.search(r"Temporary password: ([^\s]+)", message.body)
    assert password_match is not None
    user = get_user_model().objects.get(email="emailed-user@example.com")
    assert user.check_password(password_match.group(1))
    assert len(password_match.group(1)) == 24
    assert "password" not in response.json()


def test_admin_user_creation_rolls_back_if_email_delivery_fails(
    admin_client,
    monkeypatch,
):
    from accounts import services

    def fail_delivery(_user, _temporary_password):
        raise OSError("SMTP unavailable")

    monkeypatch.setattr(services, "send_temporary_password_email", fail_delivery)
    response = post_json(
        admin_client,
        reverse("user-list"),
        {"email": "no-email@example.com", "role": "client"},
    )

    assert response.status_code == 503
    assert not get_user_model().objects.filter(email="no-email@example.com").exists()
