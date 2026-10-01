from rest_framework import mixins, viewsets

from .models import User
from .permissions import IsAdmin
from .serializers import UserManagementSerializer


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
