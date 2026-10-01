import csv
from datetime import datetime, timezone
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import IntegrityError
from django.utils.dateparse import parse_datetime

from episodes.models import Episode, EpisodeQuality


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
DATE_FORMATS = (
    "%d/%m/%Y %H:%M",
    "%Y-%m-%d %H:%M:%S",
)


class Command(BaseCommand):
    help = "Import recording-system episode metadata from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=Path)

    def handle(self, *args, **options):
        csv_path = options["csv_path"]
        if not csv_path.is_file():
            raise CommandError(f"CSV file not found: {csv_path}")

        counts = {"imported": 0, "skipped": 0, "invalid": 0}
        with csv_path.open("r", encoding="utf-8-sig", newline="") as source:
            reader = csv.DictReader(source)
            missing_columns = REQUIRED_COLUMNS - set(reader.fieldnames or ())
            if missing_columns:
                missing = ", ".join(sorted(missing_columns))
                raise CommandError(f"Missing CSV columns: {missing}")

            seen_ids = set()
            for line_number, row in enumerate(reader, start=2):
                if row.get(None):
                    counts["invalid"] += 1
                    self.stderr.write(
                        f"row {line_number}: invalid - malformed extra columns"
                    )
                    continue
                try:
                    episode = self.parse_row(row, line_number, seen_ids)
                except ValueError as exc:
                    counts["invalid"] += 1
                    self.stderr.write(f"row {line_number}: invalid - {exc}")
                    continue

                if episode.episode_id in seen_ids:
                    counts["skipped"] += 1
                    self.stdout.write(
                        f"row {line_number}: skipped - duplicate episode_id "
                        f"{episode.episode_id} in file"
                    )
                    continue
                seen_ids.add(episode.episode_id)

                if Episode.objects.filter(episode_id=episode.episode_id).exists():
                    counts["skipped"] += 1
                    self.stdout.write(
                        f"row {line_number}: skipped - episode_id "
                        f"{episode.episode_id} already exists"
                    )
                    continue

                try:
                    Episode.objects.create(
                        episode_id=episode.episode_id,
                        robot_id=episode.robot_id,
                        task_name=episode.task_name,
                        recorded_at=episode.recorded_at,
                        duration_seconds=episode.duration_seconds,
                        operator_name=episode.operator_name,
                        quality=episode.quality,
                    )
                except IntegrityError:
                    counts["skipped"] += 1
                    self.stdout.write(
                        f"row {line_number}: skipped - episode_id "
                        f"{episode.episode_id} already exists"
                    )
                else:
                    counts["imported"] += 1

        self.stdout.write(
            self.style.SUCCESS(
                "Import complete: "
                f"{counts['imported']} imported, "
                f"{counts['skipped']} skipped, "
                f"{counts['invalid']} invalid."
            )
        )

    @staticmethod
    def parse_row(row, line_number, seen_ids):
        values = {key: (row.get(key) or "").strip() for key in REQUIRED_COLUMNS}
        episode_id = values["episode_id"]
        if not episode_id:
            raise ValueError("missing episode_id")
        if episode_id in seen_ids:
            return Episode(episode_id=episode_id)

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
                    recorded_at = datetime.strptime(
                        values["recorded_at"], date_format
                    ).replace(tzinfo=timezone.utc)
                    break
                except ValueError:
                    continue
        if recorded_at is None:
            raise ValueError("recorded_at has an unsupported date format")
        if recorded_at.tzinfo is None:
            recorded_at = recorded_at.replace(tzinfo=timezone.utc)

        return Episode(
            episode_id=episode_id,
            robot_id=robot_id,
            task_name=task_name,
            recorded_at=recorded_at,
            duration_seconds=duration_seconds,
            operator_name=values["operator_name"],
            quality=quality,
        )
