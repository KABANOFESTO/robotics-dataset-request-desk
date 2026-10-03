from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.db import connection
from django.db.utils import OperationalError
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import UserViewSet
from episodes.views import EpisodeViewSet
from requests.views import AnalyticsView, DatasetRequestViewSet


router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("episodes", EpisodeViewSet, basename="episode")
router.register("requests", DatasetRequestViewSet, basename="dataset-request")


def health_check(_request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
    except OperationalError:
        return JsonResponse({"status": "unavailable"}, status=503)
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("", health_check, name="root-health-check"),
    path("healthz/", health_check, name="health-check"),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/analytics/", AnalyticsView.as_view({"get": "list"}), name="analytics"),
    path("api/", include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
