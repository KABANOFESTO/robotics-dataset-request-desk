from typing import ClassVar

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from episodes.models import EpisodeQuality


class RequestStatus(models.TextChoices):
    SUBMITTED = "submitted", "Submitted"
    IN_PROGRESS = "in_progress", "In Progress"
    DELIVERED = "delivered", "Delivered"
    ACCEPTED = "accepted", "Accepted"
    REJECTED = "rejected", "Rejected"

    @classmethod
    def transitions(cls):
        return {
            cls.SUBMITTED: {cls.IN_PROGRESS},
            cls.IN_PROGRESS: {cls.DELIVERED},
            cls.DELIVERED: {cls.ACCEPTED, cls.REJECTED},
            cls.REJECTED: {cls.IN_PROGRESS},
            cls.ACCEPTED: set(),
        }


class DatasetRequest(models.Model):
    client = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="dataset_requests",
    )

    task_name = models.CharField(
        max_length=255,
        db_index=True,
    )

    episodes_requested = models.PositiveIntegerField(
        validators=[MinValueValidator(1)],
    )

    deadline = models.DateField(
        db_index=True,
    )

    notes = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
        default=RequestStatus.SUBMITTED,
        db_index=True,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-created_at"]
        indexes: ClassVar[list[models.Index]] = [
            models.Index(
                fields=["client", "status"],
                name="request_client_status_idx",
            ),
        ]
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=~models.Q(task_name=""),
                name="request_task_name_not_blank",
            ),
            models.CheckConstraint(
                condition=models.Q(episodes_requested__gte=1),
                name="request_episodes_requested_positive",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    status__in=[status.value for status in RequestStatus]
                ),
                name="request_status_valid",
            ),
        ]

    @transaction.atomic
    def transition_to(self, new_status, *, changed_by):
        """Apply one legal transition and record its actor atomically."""
        # Lock the request so concurrent operators cannot bypass a transition rule.
        request = type(self).objects.select_for_update().get(pk=self.pk)
        allowed_statuses = RequestStatus.transitions()[request.status]
        if new_status not in allowed_statuses:
            raise ValidationError(
                f"Cannot transition from {request.status} to {new_status}."
            )

        if (
            new_status == RequestStatus.DELIVERED
            and request.assignments.count() < request.episodes_requested
        ):
            raise ValidationError(
                "A request needs all requested episodes before delivery."
            )

        previous_status = request.status
        request.status = new_status
        request.save(update_fields=["status", "updated_at"])
        RequestStatusHistory.objects.create(
            request=request,
            from_status=previous_status,
            to_status=new_status,
            changed_by=changed_by,
        )
        self.status = request.status
        self.updated_at = request.updated_at
        if hasattr(self, "_prefetched_objects_cache"):
            self._prefetched_objects_cache.pop("status_history", None)
        return self

    def __str__(self):
        return f"Request #{self.pk} - {self.task_name}"


class Assignment(models.Model):
    request = models.ForeignKey(
        DatasetRequest,
        on_delete=models.CASCADE,
        related_name="assignments",
    )

    episode = models.OneToOneField(
        "episodes.Episode",
        on_delete=models.PROTECT,
        related_name="assignment",
    )

    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="episode_assignments",
    )

    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["-assigned_at"]

    def clean(self):
        # Role authorization belongs in the API/service layer where the actor is known.
        if self.request_id and self.request.status in {
            RequestStatus.DELIVERED,
            RequestStatus.ACCEPTED,
        }:
            raise ValidationError(
                {"request": "Delivered requests cannot receive new episodes."}
            )
        if self.episode_id and self.episode.quality == EpisodeQuality.BAD:
            raise ValidationError(
                {"episode": "Bad-quality episodes cannot be assigned."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.episode.episode_id} → Request #{self.request_id}"


class RequestStatusHistory(models.Model):
    request = models.ForeignKey(
        DatasetRequest,
        on_delete=models.CASCADE,
        related_name="status_history",
    )

    from_status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
        blank=True,
    )

    to_status = models.CharField(
        max_length=20,
        choices=RequestStatus.choices,
    )

    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="status_changes",
    )

    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering: ClassVar[list[str]] = ["changed_at"]
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(
                    to_status__in=[status.value for status in RequestStatus]
                ),
                name="history_to_status_valid",
            ),
            models.CheckConstraint(
                condition=models.Q(from_status="")
                | models.Q(from_status__in=[status.value for status in RequestStatus]),
                name="history_from_status_valid",
            ),
        ]

    def __str__(self):
        return f"Request #{self.request_id}: {self.from_status} → {self.to_status}"
