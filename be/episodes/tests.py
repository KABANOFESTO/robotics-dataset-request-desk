from django.urls import reverse

from requests.models import Assignment


def test_operator_can_filter_episodes(operator_client, episode, bad_episode):
    response = operator_client.get(
        reverse("episode-list"),
        {"task_name": "pick", "quality": "good"},
    )

    assert response.status_code == 200
    assert [item["episode_id"] for item in response.json()] == [episode.episode_id]
    assert response.json()[0]["assigned"] is False


def test_available_filter_excludes_assigned_episode(
    operator_client,
    operator_user,
    dataset_request,
    episode,
):
    Assignment.objects.create(
        request=dataset_request,
        episode=episode,
        assigned_by=operator_user,
    )

    response = operator_client.get(reverse("episode-list"), {"available": "true"})

    assert response.status_code == 200
    assert episode.episode_id not in [item["episode_id"] for item in response.json()]


def test_client_cannot_browse_episodes(auth_client):
    response = auth_client.get(reverse("episode-list"))

    assert response.status_code == 403
