import json

from django.urls import reverse


def post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")


def test_user_can_obtain_jwt_pair(client, user):
    response = post_json(
        client,
        reverse("token_obtain_pair"),
        {"email": user.email, "password": "strong-test-password"},
    )

    assert response.status_code == 200
    assert {"access", "refresh"}.issubset(response.json())


def test_invalid_credentials_are_rejected(client, user):
    response = post_json(
        client,
        reverse("token_obtain_pair"),
        {"email": user.email, "password": "wrong-password"},
    )

    assert response.status_code == 401


def test_refresh_and_verify_endpoints_accept_valid_tokens(client, user):
    token_response = post_json(
        client,
        reverse("token_obtain_pair"),
        {"email": user.email, "password": "strong-test-password"},
    )
    refresh_token = token_response.json()["refresh"]

    refresh_response = post_json(
        client,
        reverse("token_refresh"),
        {"refresh": refresh_token},
    )
    verify_response = post_json(
        client,
        reverse("token_verify"),
        {"token": refresh_token},
    )

    assert refresh_response.status_code == 200
    assert "access" in refresh_response.json()
    assert verify_response.status_code == 200
