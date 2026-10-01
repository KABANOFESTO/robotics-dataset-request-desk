import pytest
from datetime import date
from django.test import Client
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.models import User, UserRole
from episodes.models import Episode, EpisodeQuality
from requests.models import DatasetRequest


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


def authenticated_client(user):
    client = Client()
    token = RefreshToken.for_user(user).access_token
    client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"
    return client


@pytest.fixture
def auth_client(user):
    return authenticated_client(user)


@pytest.fixture
def operator_client(operator_user):
    return authenticated_client(operator_user)


@pytest.fixture
def admin_client(admin_user):
    return authenticated_client(admin_user)


@pytest.fixture
def episode(db):
    return Episode.objects.create(
        episode_id="EP-001",
        robot_id="arm-01",
        task_name="pick cup",
        recorded_at="2026-09-01T10:00:00Z",
        duration_seconds=30,
        quality=EpisodeQuality.GOOD,
    )


@pytest.fixture
def bad_episode(db):
    return Episode.objects.create(
        episode_id="EP-002",
        robot_id="arm-01",
        task_name="pick cup",
        recorded_at="2026-09-01T10:00:00Z",
        duration_seconds=30,
        quality=EpisodeQuality.BAD,
    )


@pytest.fixture
def dataset_request(db, user):
    return DatasetRequest.objects.create(
        client=user,
        task_name="pick cup",
        episodes_requested=1,
        deadline=date(2026, 10, 31),
    )
