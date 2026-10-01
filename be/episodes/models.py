from typing import ClassVar

from django.core.validators import MinValueValidator
from django.db import models


class EpisodeQuality(models.TextChoices):
    GOOD = "good", "Good"
    USABLE = "usable", "Usable"
    BAD = "bad", "Bad"


class Episode(models.Model):
    episode_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
    )

    robot_id = models.CharField(
        max_length=100,
        db_index=True,
    )

    task_name = models.CharField(
        max_length=255,
        db_index=True,
    )

    recorded_at = models.DateTimeField(
        db_index=True,
    )

    duration_seconds = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
    )

    operator_name = models.CharField(
        max_length=255,
        blank=True,
    )

    quality = models.CharField(
        max_length=20,
        choices=EpisodeQuality.choices,
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-recorded_at"]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=["task_name", "quality"],
                name="episode_task_quality_idx",
            ),
            models.Index(
                fields=["robot_id", "recorded_at"],
                name="episode_robot_date_idx",
            ),
        ]

    def __str__(self):
        return self.episode_id
