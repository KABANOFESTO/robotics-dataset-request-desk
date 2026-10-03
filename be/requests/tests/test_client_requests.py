import json

from django.urls import reverse
from accounts.models import User
from requests.models import DatasetRequest, RequestStatus
from test_helpers import post_json


def test_client_can_create_request(auth_client):
    response = post_json(
        auth_client,
        reverse("dataset-request-list"),
        {
            "task_name": "pick cup",
            "episodes_requested": 2,
            "deadline": "2026-10-31",
            "notes": "Use arm-01 recordings.",
        },
    )

    assert response.status_code == 201
    assert response.json()["status"] == RequestStatus.SUBMITTED


def test_client_sees_only_owned_requests(auth_client, user, db):
    other_client = User.objects.create_user(
        email="other-client@example.com",
        password="strong-other-password",
    )
    own_request = DatasetRequest.objects.create(
        client=user,
        task_name="own task",
        episodes_requested=1,
        deadline="2026-10-31",
    )
    DatasetRequest.objects.create(
        client=other_client,
        task_name="private task",
        episodes_requested=1,
        deadline="2026-10-31",
    )

    response = auth_client.get(reverse("dataset-request-list"))

    assert response.status_code == 200
    assert [item["id"] for item in response.json()] == [own_request.id]


def test_client_cannot_access_another_clients_request(auth_client, db):
    other_client = User.objects.create_user(
        email="private-client@example.com",
        password="strong-private-password",
    )
    private_request = DatasetRequest.objects.create(
        client=other_client,
        task_name="private task",
        episodes_requested=1,
        deadline="2026-10-31",
    )

    detail_response = auth_client.get(
        reverse("dataset-request-detail", args=[private_request.id])
    )
    review_response = auth_client.post(
        reverse("dataset-request-review", args=[private_request.id]),
        data=json.dumps({"status": RequestStatus.ACCEPTED}),
        content_type="application/json",
    )

    assert detail_response.status_code == 404
    assert review_response.status_code == 404
