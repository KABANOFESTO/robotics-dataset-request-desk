import pytest
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="client@example.com",
        password="strong-test-password",
    )


@pytest.fixture
def operator_user(db):
    return User.objects.create_user(
        email="operator@example.com",
        password="strong-operator-password",
        role=UserRole.OPERATOR,
    )


@pytest.fixture
def admin_user(db):
    return User.objects.create_user(
        email="admin@example.com",
        password="strong-admin-password",
        role=UserRole.ADMIN,
    )


def authenticated_client(client, user):
    token = RefreshToken.for_user(user).access_token
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client


@pytest.fixture
def auth_client(client, user):
    return authenticated_client(client, user)


@pytest.fixture
def operator_client(client, operator_user):
    return authenticated_client(client, operator_user)


@pytest.fixture
def admin_client(client, admin_user):
    return authenticated_client(client, admin_user)
