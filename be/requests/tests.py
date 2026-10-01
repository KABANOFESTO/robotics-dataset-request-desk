import json

from django.urls import reverse

from accounts.models import User
from requests.models import Assignment, DatasetRequest, RequestStatus


def post_json(client, url, data):
    return client.post(url, data=json.dumps(data), content_type="application/json")


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


def test_operator_can_start_request(operator_client, dataset_request):
    response = post_json(
        operator_client,
        reverse("dataset-request-transition", args=[dataset_request.id]),
        {"status": RequestStatus.IN_PROGRESS},
    )

    assert response.status_code == 200
    dataset_request.refresh_from_db()
    assert dataset_request.status == RequestStatus.IN_PROGRESS


def test_request_cannot_be_delivered_before_assignments(
    operator_client,
    dataset_request,
):
    dataset_request.status = RequestStatus.IN_PROGRESS
    dataset_request.save(update_fields=["status"])

    response = post_json(
        operator_client,
        reverse("dataset-request-transition", args=[dataset_request.id]),
        {"status": RequestStatus.DELIVERED},
    )

    assert response.status_code == 400


def test_operator_can_assign_episode_and_deliver(
    operator_client,
    dataset_request,
    episode,
):
    dataset_request.status = RequestStatus.IN_PROGRESS
    dataset_request.save(update_fields=["status"])

    assignment_response = post_json(
        operator_client,
        reverse("dataset-request-assign", args=[dataset_request.id]),
        {"episode": episode.id},
    )
    delivery_response = post_json(
        operator_client,
        reverse("dataset-request-transition", args=[dataset_request.id]),
        {"status": RequestStatus.DELIVERED},
    )

    assert assignment_response.status_code == 201
    assert delivery_response.status_code == 200


def test_bad_episode_cannot_be_assigned(operator_client, dataset_request, bad_episode):
    response = post_json(
        operator_client,
        reverse("dataset-request-assign", args=[dataset_request.id]),
        {"episode": bad_episode.id},
    )

    assert response.status_code == 400


def test_episode_cannot_be_assigned_to_two_requests(
    operator_client,
    dataset_request,
    episode,
    operator_user,
    db,
):
    second_request = DatasetRequest.objects.create(
        client=dataset_request.client,
        task_name="second task",
        episodes_requested=1,
        deadline="2026-10-31",
    )
    Assignment.objects.create(
        request=dataset_request,
        episode=episode,
        assigned_by=operator_user,
    )

    response = post_json(
        operator_client,
        reverse("dataset-request-assign", args=[second_request.id]),
        {"episode": episode.id},
    )

    assert response.status_code == 400


from django.test import TestCase

# Create your tests here.
