from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from rest_framework.exceptions import PermissionDenied

from accounts.models import UserRole

from .models import Assignment, DatasetRequest, RequestStatus


_OPERATOR_STATUSES = {RequestStatus.IN_PROGRESS, RequestStatus.DELIVERED}
_REVIEW_STATUSES = {RequestStatus.ACCEPTED, RequestStatus.REJECTED}
_LOCKED_ASSIGNMENT_STATUSES = {RequestStatus.DELIVERED, RequestStatus.ACCEPTED}


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
    if request.status in _LOCKED_ASSIGNMENT_STATUSES:
        raise ValidationError("Delivered requests cannot receive new episodes.")

    try:
        return Assignment.objects.create(
            request=request,
            episode=episode,
            assigned_by=actor,
        )
    except IntegrityError as exc:
        raise ValidationError("This episode is already assigned.") from exc
