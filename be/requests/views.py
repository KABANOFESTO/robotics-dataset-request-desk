from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError, transaction
from rest_framework import decorators, exceptions, mixins, response, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserRole
from accounts.permissions import IsClient, IsOperatorOrAdmin

from .models import Assignment, DatasetRequest, RequestStatus
from .serializers import (
    AssignmentCreateSerializer,
    AssignmentSerializer,
    DatasetRequestSerializer,
    RequestStatusSerializer,
)


class DatasetRequestViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = DatasetRequest.objects.select_related("client").prefetch_related(
        "assignments__episode"
    )
    serializer_class = DatasetRequestSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == UserRole.CLIENT:
            return queryset.filter(client=self.request.user)
        return queryset

    def get_permissions(self):
        if self.action == "create":
            permission_classes = (IsClient,)
        elif self.action in {"transition", "assign"}:
            permission_classes = (IsOperatorOrAdmin,)
        else:
            permission_classes = (IsAuthenticated,)
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @decorators.action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        dataset_request = self.get_object()
        serializer = RequestStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            dataset_request.transition_to(
                serializer.validated_data["status"],
                changed_by=request.user,
            )
        except DjangoValidationError as exc:
            raise exceptions.ValidationError(exc.message)

        return response.Response(self.get_serializer(dataset_request).data)

    @decorators.action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        dataset_request = self.get_object()
        if dataset_request.client_id != request.user.id:
            raise exceptions.PermissionDenied(
                "Only the request owner can review a delivery."
            )

        serializer = RequestStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status = serializer.validated_data["status"]
        if status not in (RequestStatus.ACCEPTED, RequestStatus.REJECTED):
            raise exceptions.ValidationError(
                {"status": "Review status must be accepted or rejected."}
            )

        try:
            dataset_request.transition_to(status, changed_by=request.user)
        except DjangoValidationError as exc:
            raise exceptions.ValidationError(exc.message)

        return response.Response(self.get_serializer(dataset_request).data)

    @decorators.action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        dataset_request = self.get_object()
        serializer = AssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            with transaction.atomic():
                assignment = Assignment.objects.create(
                    request=dataset_request,
                    episode=serializer.validated_data["episode"],
                    assigned_by=request.user,
                )
        except DjangoValidationError as exc:
            raise exceptions.ValidationError(exc.message_dict)
        except IntegrityError:
            raise exceptions.ValidationError(
                {"episode": "This episode is already assigned."}
            )

        return response.Response(
            AssignmentSerializer(assignment).data,
            status=201,
        )
