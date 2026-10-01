from io import StringIO

from django.core.management import call_command
from django.urls import reverse

from episodes.models import Episode
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


def test_import_episodes_is_idempotent_and_reports_skips(tmp_path, db):
    csv_path = tmp_path / "episodes.csv"
    csv_path.write_text(
        "episode_id,robot_id,task_name,recorded_at,duration_seconds,operator_name,quality\n"
        "EP-IMPORT-1, ARM-01, pick   cup,2026-09-01T10:00:00,30,Aline,GOOD\n"
        "EP-IMPORT-1,arm-01,pick cup,2026-09-01T10:00:00,30,Aline,good\n"
        "EP-IMPORT-2,unknown-robot,pick cup,2026-09-01T10:00:00,30,Aline,good\n",
        encoding="utf-8",
    )

    first_output = StringIO()
    first_errors = StringIO()
    call_command(
        "import_episodes",
        str(csv_path),
        stdout=first_output,
        stderr=first_errors,
    )

    second_output = StringIO()
    call_command("import_episodes", str(csv_path), stdout=second_output)

    assert Episode.objects.count() == 1
    assert "1 imported" in first_output.getvalue()
    assert "1 skipped" in first_output.getvalue()
    assert "1 invalid" in first_output.getvalue()
    assert "0 imported" in second_output.getvalue()
    assert "2 skipped" in second_output.getvalue()
