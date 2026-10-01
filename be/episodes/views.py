from rest_framework import mixins, viewsets

from accounts.permissions import IsOperatorOrAdmin

from .models import Episode
from .serializers import EpisodeSerializer


class EpisodeViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Episode.objects.select_related("assignment")
    serializer_class = EpisodeSerializer
    permission_classes = (IsOperatorOrAdmin,)

    def get_queryset(self):
        queryset = super().get_queryset()
        task_name = self.request.query_params.get("task_name")
        quality = self.request.query_params.get("quality")
        available = self.request.query_params.get("available")

        if task_name:
            queryset = queryset.filter(task_name__icontains=task_name)
        if quality:
            queryset = queryset.filter(quality=quality)
        if available == "true":
            queryset = queryset.filter(assignment__isnull=True)
        return queryset
