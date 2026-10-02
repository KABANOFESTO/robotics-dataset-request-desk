from rest_framework import generics, mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from .models import User
from .permissions import IsAdmin
from .serializers import CurrentUserSerializer, UserManagementSerializer


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
