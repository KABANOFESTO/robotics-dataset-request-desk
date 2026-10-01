from rest_framework.permissions import BasePermission

from .models import UserRole


class HasRole(BasePermission):
    allowed_roles = ()
    message = "You do not have permission to perform this action."

    def has_permission(self, request, view):
        user = request.user
        # Authorization is evaluated on the server for every protected request.
        return (
            user.is_authenticated and user.is_active and user.role in self.allowed_roles
        )


class IsAdmin(HasRole):
    allowed_roles = (UserRole.ADMIN,)
    message = "Only administrators can manage users."


class IsOperatorOrAdmin(HasRole):
    allowed_roles = (UserRole.OPERATOR, UserRole.ADMIN)


class IsClient(HasRole):
    allowed_roles = (UserRole.CLIENT,)
