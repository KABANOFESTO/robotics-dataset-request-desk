from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from accounts.views import UserViewSet
from episodes.views import EpisodeViewSet
from requests.views import DatasetRequestViewSet


router = DefaultRouter()
router.register("users", UserViewSet, basename="user")
router.register("episodes", EpisodeViewSet, basename="episode")
router.register("requests", DatasetRequestViewSet, basename="dataset-request")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include(router.urls)),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
