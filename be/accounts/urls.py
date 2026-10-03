from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView,
)

from .views import CurrentUserView

urlpatterns = [
    path("me/", CurrentUserView.as_view(), name="current-user"),
    # Accept both URL forms for clients that omit Django's conventional slash.
    # This keeps auth requests resolving to their DRF views instead of falling
    # through to Django's CSRF-protected 404 handling.
    path("me", CurrentUserView.as_view(), name="current-user-no-slash"),
    path("token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token", TokenObtainPairView.as_view(), name="token_obtain_pair-no-slash"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("token/verify/", TokenVerifyView.as_view(), name="token_verify"),
]
