from io import TextIOWrapper

from rest_framework import decorators, exceptions, mixins, parsers, response, status, viewsets
from rest_framework.permissions import IsAuthenticated

from accounts.permissions import IsOperatorOrAdmin

from .importing import EpisodeImportError, import_episode_csv
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

    @decorators.action(
        detail=False,
        methods=["get"],
        url_path="tasks",
        permission_classes=[IsAuthenticated],
    )
    def tasks(self, request):
        """Return available dataset task names without exposing episode records."""
        eligible_tasks = Episode.objects.filter(
            quality__in=("good", "usable"),
        ).values_list("task_name", flat=True).distinct()
        normalized = {}
        for task_name in eligible_tasks:
            task_name = " ".join(task_name.split()).casefold()
            normalized.setdefault(task_name, task_name)

        return response.Response({"tasks": sorted(normalized.values(), key=str.casefold)})

    @decorators.action(
        detail=False,
        methods=["post"],
        url_path="import",
        parser_classes=[parsers.MultiPartParser],
        permission_classes=[IsOperatorOrAdmin],
    )
    def import_csv(self, request):
        """Import CSV rows, keeping valid records and reporting rejected rows."""
        upload = request.FILES.get("file")
        if upload is None:
            raise exceptions.ValidationError({"file": "Choose a CSV file to import."})
        if not upload.name.lower().endswith(".csv"):
            raise exceptions.ValidationError({"file": "The uploaded file must be a .csv file."})
        max_bytes = 10 * 1024 * 1024
        if upload.size > max_bytes:
            raise exceptions.ValidationError({"file": "The CSV file must be 10 MB or smaller."})

        source = TextIOWrapper(upload.file, encoding="utf-8-sig", newline="")
        try:
            result = import_episode_csv(source)
        except (EpisodeImportError, UnicodeError) as exc:
            raise exceptions.ValidationError({"file": str(exc)}) from exc
        finally:
            source.detach()

        return response.Response(result, status=status.HTTP_200_OK)
