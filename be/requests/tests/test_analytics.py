import json
from datetime import datetime, timezone

from django.urls import reverse
from requests.models import RequestStatus, RequestStatusHistory


def test_operator_can_read_analytics(operator_client, episode, dataset_request, db):
    dataset_request.created_at = datetime(2026, 9, 2, tzinfo=timezone.utc)
    dataset_request.save(update_fields=["created_at"])
    history = RequestStatusHistory.objects.create(
        request=dataset_request,
        from_status=RequestStatus.SUBMITTED,
        to_status=RequestStatus.DELIVERED,
        changed_by=dataset_request.client,
    )
    RequestStatusHistory.objects.filter(pk=history.pk).update(
        changed_at=datetime(2026, 9, 4, tzinfo=timezone.utc)
    )

    response = operator_client.get(
        reverse("analytics"),
        {"start_date": "2026-09-01", "end_date": "2026-09-30"},
    )

    assert response.status_code == 200
    assert response.json()["episodes_per_day_per_robot"] == [
        {"date": "2026-09-01", "robot_id": "arm-01", "count": 1}
    ]
    assert response.json()["request_fulfillment"]["by_status"] == [
        {"status": "submitted", "count": 1},
        {"status": "in_progress", "count": 0},
        {"status": "delivered", "count": 0},
        {"status": "accepted", "count": 0},
        {"status": "rejected", "count": 0},
    ]
    assert (
        response.json()["request_fulfillment"]["median_submitted_to_delivered_seconds"]
        == 172800.0
    )
    assert response.json()["top_good_tasks"] == [{"task_name": "pick cup", "count": 1}]


def test_client_cannot_read_analytics(auth_client):
    response = auth_client.get(
        reverse("analytics"),
        {"start_date": "2026-09-01", "end_date": "2026-09-30"},
    )

    assert response.status_code == 403
