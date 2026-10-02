from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import decorators, exceptions, mixins, response, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.models import UserRole
from accounts.permissions import IsClient, IsOperatorOrAdmin

from .analytics import (
    AnalyticsQuerySerializer,
    date_bounds,
    episodes_per_day,
    median_submitted_to_delivered,
    request_fulfillment,
    top_good_tasks,
)
from .models import DatasetRequest
from .services import assign_episode, transition_request
from .serializers import (
    AssignmentCreateSerializer,
    AssignmentSerializer,
    DatasetRequestSerializer,
    RequestStatusSerializer,
)


def validation_detail(error):
    return error.message_dict if hasattr(error, "message_dict") else error.messages


class DatasetRequestViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = DatasetRequest.objects.select_related("client").prefetch_related(
        "assignments__episode",
        "status_history__changed_by",
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
        status = serializer.validated_data["status"]
        try:
            transition_request(dataset_request, status, actor=request.user)
        except DjangoValidationError as exc:
            raise exceptions.ValidationError(validation_detail(exc))

        return response.Response(self.get_serializer(dataset_request).data)

    @decorators.action(detail=True, methods=["post"])
    def review(self, request, pk=None):
        dataset_request = self.get_object()
        serializer = RequestStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        status = serializer.validated_data["status"]
        try:
            transition_request(dataset_request, status, actor=request.user)
        except DjangoValidationError as exc:
            raise exceptions.ValidationError(validation_detail(exc))

        return response.Response(self.get_serializer(dataset_request).data)

    @decorators.action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        dataset_request = self.get_object()
        serializer = AssignmentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            assignment = assign_episode(
                dataset_request,
                serializer.validated_data["episode"],
                actor=request.user,
            )
        except DjangoValidationError as exc:
            raise exceptions.ValidationError(validation_detail(exc))

        return response.Response(
            AssignmentSerializer(assignment).data,
            status=201,
        )


class AnalyticsView(viewsets.ViewSet):
    permission_classes = (IsOperatorOrAdmin,)

    def list(self, request):
        serializer = AnalyticsQuerySerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        start, end = date_bounds(
            serializer.validated_data["start_date"],
            serializer.validated_data["end_date"],
        )

        return response.Response(
            {
                "date_range": {
                    "start_date": serializer.validated_data["start_date"],
                    "end_date": serializer.validated_data["end_date"],
                },
                "episodes_per_day_per_robot": episodes_per_day(start, end),
                "request_fulfillment": {
                    "by_status": request_fulfillment(start, end),
                    "median_submitted_to_delivered_seconds": (
                        median_submitted_to_delivered(start, end)
                    ),
                },
                "top_good_tasks": top_good_tasks(start, end),
            }
        )
