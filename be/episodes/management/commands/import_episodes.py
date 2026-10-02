from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from episodes.importing import EpisodeImportError, import_episode_csv


class Command(BaseCommand):
    help = "Import recording-system episode metadata from a CSV file."

    def add_arguments(self, parser):
        parser.add_argument("csv_path", type=Path)

    def handle(self, *args, **options):
        csv_path = options["csv_path"]
        if not csv_path.is_file():
            raise CommandError(f"CSV file not found: {csv_path}")

        try:
            with csv_path.open("r", encoding="utf-8-sig", newline="") as source:
                result = import_episode_csv(source)
        except (OSError, UnicodeError, EpisodeImportError) as exc:
            raise CommandError(str(exc)) from exc

        for issue in result["issues"]:
            self.stdout.write(
                f"row {issue['line']}: {issue['category']} - {issue['message']}"
            )
        if result["issues_truncated"]:
            self.stdout.write("Only the first 100 row issues are shown.")

        self.stdout.write(
            self.style.SUCCESS(
                "Import complete: "
                f"{result['imported']} imported, "
                f"{result['skipped']} skipped, "
                f"{result['invalid']} invalid."
            )
        )
