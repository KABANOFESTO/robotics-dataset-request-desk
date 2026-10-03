from io import StringIO

from django.core.management import call_command

from episodes.models import Episode


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
