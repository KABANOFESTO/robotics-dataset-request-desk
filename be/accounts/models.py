from typing import ClassVar

from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    CLIENT = "client", "Client"
    OPERATOR = "operator", "Operator"
    ADMIN = "admin", "Admin"


class User(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.CLIENT,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints: ClassVar[list[models.BaseConstraint]] = [
            models.CheckConstraint(
                condition=models.Q(role__in=[role.value for role in UserRole]),
                name="user_role_valid",
            ),
        ]

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    def __str__(self):
        return f"{self.email} ({self.role})"
