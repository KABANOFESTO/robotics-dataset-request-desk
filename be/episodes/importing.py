import csv
from datetime import datetime, timezone

from django.db import IntegrityError, transaction
from django.utils.dateparse import parse_datetime

from .models import Episode, EpisodeQuality

KNOWN_ROBOTS = {"arm-01", "arm-02", "arm-03", "mobile-01", "humanoid-01"}
REQUIRED_COLUMNS = {
    "episode_id",
    "robot_id",
    "task_name",
    "recorded_at",
    "duration_seconds",
    "operator_name",
    "quality",
}
DATE_FORMATS = ("%d/%m/%Y %H:%M", "%Y-%m-%d %H:%M:%S")
MAX_REPORTED_ISSUES = 100


class EpisodeImportError(ValueError):
    pass


def parse_episode_row(row):
    values = {key: (row.get(key) or "").strip() for key in REQUIRED_COLUMNS}
    episode_id = values["episode_id"]
    if not episode_id:
        raise ValueError("missing episode_id")

    robot_id = values["robot_id"].lower()
    if robot_id not in KNOWN_ROBOTS:
        raise ValueError(f"unknown robot_id {robot_id!r}")

    task_name = " ".join(values["task_name"].split())
    if not task_name:
        raise ValueError("missing task_name")

    try:
        duration_seconds = int(values["duration_seconds"])
    except ValueError as exc:
        raise ValueError("duration_seconds must be an integer") from exc
    if duration_seconds < 1:
        raise ValueError("duration_seconds must be positive")

    quality = values["quality"].lower()
    valid_quality = {choice.value for choice in EpisodeQuality}
    if quality not in valid_quality:
        raise ValueError(f"quality must be one of {sorted(valid_quality)}")

    recorded_at = parse_datetime(values["recorded_at"])
    if recorded_at is None:
        for date_format in DATE_FORMATS:
            try:
                recorded_at = datetime.strptime(values["recorded_at"], date_format).replace(
                    tzinfo=timezone.utc,
                )
                break
            except ValueError:
                continue
    if recorded_at is None:
        raise ValueError("recorded_at has an unsupported date format")
    if recorded_at.tzinfo is None:
        recorded_at = recorded_at.replace(tzinfo=timezone.utc)

    return {
        "episode_id": episode_id,
        "robot_id": robot_id,
        "task_name": task_name,
        "recorded_at": recorded_at,
        "duration_seconds": duration_seconds,
        "operator_name": values["operator_name"],
        "quality": quality,
    }


def import_episode_csv(source):
    """Import valid CSV rows while reporting duplicates and invalid rows."""
    counts = {"imported": 0, "skipped": 0, "invalid": 0}
    issues = []

    def report(line, category, message):
        counts[category] += 1
        if len(issues) < MAX_REPORTED_ISSUES:
            issues.append({"line": line, "category": category, "message": message})

    reader = csv.DictReader(source)
    missing_columns = REQUIRED_COLUMNS - set(reader.fieldnames or ())
    if missing_columns:
        raise EpisodeImportError(
            "Missing CSV columns: " + ", ".join(sorted(missing_columns)),
        )

    seen_ids = set()
    for line_number, row in enumerate(reader, start=2):
        if row.get(None):
            report(line_number, "invalid", "malformed extra columns")
            continue
        try:
            episode = parse_episode_row(row)
        except ValueError as exc:
            report(line_number, "invalid", str(exc))
            continue

        episode_id = episode["episode_id"]
        if episode_id in seen_ids:
            report(line_number, "skipped", f"duplicate episode_id {episode_id} in file")
            continue
        seen_ids.add(episode_id)

        if Episode.objects.filter(episode_id=episode_id).exists():
            report(line_number, "skipped", f"episode_id {episode_id} already exists")
            continue

        try:
            with transaction.atomic():
                Episode.objects.create(**episode)
        except IntegrityError:
            report(line_number, "skipped", f"episode_id {episode_id} already exists")
        else:
            counts["imported"] += 1

    return {**counts, "issues": issues, "issues_truncated": sum(counts.values()) > len(issues)}
