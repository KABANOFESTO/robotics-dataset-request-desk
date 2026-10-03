import json

from django.urls import reverse
from requests.models import Assignment, RequestStatus, RequestStatusHistory
from test_helpers import post_json


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
    operator_user,
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

def test_client_can_accept_delivered_request(
    auth_client,
    operator_client,
    operator_user,
    dataset_request,
    episode,
):
    dataset_request.status = RequestStatus.IN_PROGRESS
    dataset_request.save(update_fields=["status"])
    Assignment.objects.create(
        request=dataset_request,
        episode=episode,
        assigned_by=operator_user,
    )
    operator_client.post(
        reverse("dataset-request-transition", args=[dataset_request.id]),
        data=json.dumps({"status": RequestStatus.DELIVERED}),
        content_type="application/json",
    )

    response = post_json(
        auth_client,
        reverse("dataset-request-review", args=[dataset_request.id]),
        {"status": RequestStatus.ACCEPTED},
    )

    assert response.status_code == 200
    assert response.json()["status"] == RequestStatus.ACCEPTED
    assert [item["to_status"] for item in response.json()["status_history"]] == [
        RequestStatus.DELIVERED,
        RequestStatus.ACCEPTED,
    ]
    assert response.json()["status_history"][-1]["changed_by_email"] == (
        dataset_request.client.email
    )
    assert list(
        RequestStatusHistory.objects.filter(request=dataset_request).values_list(
            "to_status", flat=True
        )
    ) == [RequestStatus.DELIVERED, RequestStatus.ACCEPTED]

def test_client_rejection_returns_request_to_rework(
    auth_client,
    operator_client,
    operator_user,
    dataset_request,
    episode,
):
    dataset_request.status = RequestStatus.IN_PROGRESS
    dataset_request.save(update_fields=["status"])
    Assignment.objects.create(
        request=dataset_request,
        episode=episode,
        assigned_by=operator_user,
    )
    operator_client.post(
        reverse("dataset-request-transition", args=[dataset_request.id]),
        data=json.dumps({"status": RequestStatus.DELIVERED}),
        content_type="application/json",
    )

    rejection_response = post_json(
        auth_client,
        reverse("dataset-request-review", args=[dataset_request.id]),
        {"status": RequestStatus.REJECTED},
    )
    rework_response = post_json(
        operator_client,
        reverse("dataset-request-transition", args=[dataset_request.id]),
        {"status": RequestStatus.IN_PROGRESS},
    )

    assert rejection_response.status_code == 200
    assert rework_response.status_code == 200
    assert rework_response.json()["status"] == RequestStatus.IN_PROGRESS

def test_operator_cannot_accept_or_reject_request(operator_client, dataset_request):
    dataset_request.status = RequestStatus.DELIVERED
    dataset_request.save(update_fields=["status"])

    response = post_json(
        operator_client,
        reverse("dataset-request-transition", args=[dataset_request.id]),
        {"status": RequestStatus.ACCEPTED},
    )

    assert response.status_code == 400
