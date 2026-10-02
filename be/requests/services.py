from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.db.models import Case, IntegerField, Value, When
from rest_framework.exceptions import PermissionDenied

from accounts.models import UserRole
from episodes.models import Episode

from .models import Assignment, DatasetRequest, RequestStatus


_OPERATOR_STATUSES = {RequestStatus.IN_PROGRESS, RequestStatus.DELIVERED}
_REVIEW_STATUSES = {RequestStatus.ACCEPTED, RequestStatus.REJECTED}


@transaction.atomic
def transition_request(request, new_status, *, actor):
    if actor.role in (UserRole.OPERATOR, UserRole.ADMIN):
        if new_status not in _OPERATOR_STATUSES:
            raise ValidationError("Operators can only start or deliver requests.")
    elif actor.role == UserRole.CLIENT:
        if request.client_id != actor.id:
            raise PermissionDenied("Only the request owner can review a delivery.")
        if new_status not in _REVIEW_STATUSES:
            raise ValidationError(
                "Clients can only accept or reject delivered requests."
            )
    else:
        raise PermissionDenied("This role cannot change request status.")

    return request.transition_to(new_status, changed_by=actor)


@transaction.atomic
def assign_episode(request, episode, *, actor):
    if actor.role not in (UserRole.OPERATOR, UserRole.ADMIN):
        raise PermissionDenied("Only operators can assign episodes.")
    locked_request = DatasetRequest.objects.select_for_update().get(pk=request.pk)
    if locked_request.status != RequestStatus.IN_PROGRESS:
        raise ValidationError("Episodes can only be assigned while a request is in progress.")
    if locked_request.assignments.count() >= locked_request.episodes_requested:
        raise ValidationError("This request already has all requested episodes.")

    try:
        with transaction.atomic():
            return Assignment.objects.create(
                request=locked_request,
                episode=episode,
                assigned_by=actor,
            )
    except IntegrityError as exc:
        raise ValidationError("This episode is already assigned.") from exc


@transaction.atomic
def assign_available_episodes(request, *, actor):
    """Fill as much of an in-progress request as possible with matching episodes."""
    if actor.role not in (UserRole.OPERATOR, UserRole.ADMIN):
        raise PermissionDenied("Only operators can assign episodes.")

    locked_request = DatasetRequest.objects.select_for_update().get(pk=request.pk)
    if locked_request.status != RequestStatus.IN_PROGRESS:
        raise ValidationError("Episodes can only be assigned while a request is in progress.")

    remaining = locked_request.episodes_requested - locked_request.assignments.count()
    if remaining <= 0:
        raise ValidationError("This request already has all requested episodes.")

    already_assigned = Assignment.objects.values("episode_id")
    available_episodes = (
        Episode.objects.filter(
            task_name__iexact=locked_request.task_name,
            quality__in=("good", "usable"),
        )
        .exclude(pk__in=already_assigned)
        .annotate(
            quality_priority=Case(
                When(quality="good", then=Value(0)),
                default=Value(1),
                output_field=IntegerField(),
            )
        )
        .order_by("quality_priority", "recorded_at", "pk")
        .select_for_update(skip_locked=True)
    )
    episodes = list(available_episodes[:remaining])
    if not episodes:
        raise ValidationError("No available good or usable episodes match this task.")

    try:
        with transaction.atomic():
            Assignment.objects.bulk_create(
                [
                    Assignment(request=locked_request, episode=episode, assigned_by=actor)
                    for episode in episodes
                ]
            )
    except IntegrityError as exc:
        raise ValidationError(
            "Some matching episodes were assigned to another request. Refresh and try again."
        ) from exc

    return list(
        Assignment.objects.filter(request=locked_request, episode__in=episodes)
        .select_related("episode")
        .order_by("episode__episode_id")
    )


@transaction.atomic
def remove_assignment(request, assignment_id, *, actor):
    if actor.role not in (UserRole.OPERATOR, UserRole.ADMIN):
        raise PermissionDenied("Only operators can remove assigned episodes.")
    locked_request = DatasetRequest.objects.select_for_update().get(pk=request.pk)
    if locked_request.status != RequestStatus.IN_PROGRESS:
        raise ValidationError(
            "Assigned episodes can only be replaced while a request is in progress."
        )

    assignment = (
        Assignment.objects.select_for_update()
        .filter(request=locked_request)
        .filter(pk=assignment_id)
        .first()
    )
    if assignment is None:
        raise ValidationError("This episode assignment does not exist on the request.")
    assignment.delete()
