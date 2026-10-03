from django.urls import reverse

from episodes.models import Episode, EpisodeQuality
from requests.models import Assignment, DatasetRequest, RequestStatus
from test_helpers import post_json


def test_bad_episode_cannot_be_assigned(operator_client, dataset_request, bad_episode):
    response = post_json(
        operator_client,
        reverse("dataset-request-assign", args=[dataset_request.id]),
        {"episode": bad_episode.id},
    )

    assert response.status_code == 400


def test_delivered_request_cannot_receive_new_assignment(
    operator_client,
    dataset_request,
    episode,
):
    dataset_request.status = RequestStatus.DELIVERED
    dataset_request.save(update_fields=["status"])

    response = post_json(
        operator_client,
        reverse("dataset-request-assign", args=[dataset_request.id]),
        {"episode": episode.id},
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


def test_operator_can_bulk_assign_available_episodes_by_quality(
    operator_client,
    operator_user,
    dataset_request,
    episode,
    db,
):
    dataset_request.status = RequestStatus.IN_PROGRESS
    dataset_request.episodes_requested = 3
    dataset_request.save(update_fields=["status", "episodes_requested"])
    usable_episode = Episode.objects.create(
        episode_id="EP-USABLE-BULK",
        robot_id="arm-01",
        task_name="pick cup",
        recorded_at="2026-09-02T10:00:00Z",
        duration_seconds=30,
        quality=EpisodeQuality.USABLE,
    )
    Episode.objects.create(
        episode_id="EP-BAD-BULK",
        robot_id="arm-01",
        task_name="pick cup",
        recorded_at="2026-09-03T10:00:00Z",
        duration_seconds=30,
        quality=EpisodeQuality.BAD,
    )
    other_request = DatasetRequest.objects.create(
        client=dataset_request.client,
        task_name="other task",
        episodes_requested=1,
        deadline="2026-10-31",
    )
    already_assigned = Episode.objects.create(
        episode_id="EP-TAKEN-BULK",
        robot_id="arm-01",
        task_name="pick cup",
        recorded_at="2026-09-04T10:00:00Z",
        duration_seconds=30,
        quality=EpisodeQuality.GOOD,
    )
    Assignment.objects.create(
        request=other_request,
        episode=already_assigned,
        assigned_by=operator_user,
    )

    response = post_json(
        operator_client,
        reverse("dataset-request-assign-available", args=[dataset_request.id]),
        {},
    )

    assert response.status_code == 201
    assert [item["episode_quality"] for item in response.json()] == ["good", "usable"]
    assert {item["episode"] for item in response.json()} == {episode.id, usable_episode.id}
    dataset_request.refresh_from_db()
    assert dataset_request.assignments.count() == 2
    assert dataset_request.status == RequestStatus.IN_PROGRESS
