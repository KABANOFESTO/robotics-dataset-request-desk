from rest_framework import generics, mixins, status, viewsets
from rest_framework.exceptions import APIException
from rest_framework.permissions import IsAuthenticated

from .models import User
from .permissions import IsAdmin
from .serializers import CurrentUserSerializer, UserManagementSerializer
from .services import TemporaryPasswordEmailError


class TemporaryPasswordDeliveryUnavailable(APIException):
    status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    default_detail = "The account was not created because its temporary password could not be emailed. Try again later."
    default_code = "credential_email_unavailable"


class CurrentUserView(generics.RetrieveAPIView):
    """Return the authenticated user's profile for frontend session hydration."""

    permission_classes = (IsAuthenticated,)
    serializer_class = CurrentUserSerializer

    def get_object(self):
        return self.request.user


class UserViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    queryset = User.objects.order_by("email")
    serializer_class = UserManagementSerializer
    permission_classes = (IsAdmin,)

    def perform_create(self, serializer):
        try:
            serializer.save()
        except TemporaryPasswordEmailError as exc:
            raise TemporaryPasswordDeliveryUnavailable() from exc
