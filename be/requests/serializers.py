from rest_framework import serializers

from episodes.models import Episode

from .models import Assignment, DatasetRequest, RequestStatus


class AssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignment
        fields = ("id", "episode", "assigned_by", "assigned_at")
        read_only_fields = ("id", "assigned_by", "assigned_at")


class DatasetRequestSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(read_only=True)
    assignments = AssignmentSerializer(many=True, read_only=True)

    class Meta:
        model = DatasetRequest
        fields = (
            "id",
            "client",
            "task_name",
            "episodes_requested",
            "deadline",
            "notes",
            "status",
            "assignments",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "client",
            "status",
            "assignments",
            "created_at",
            "updated_at",
        )


class RequestStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=RequestStatus.choices)


class AssignmentCreateSerializer(serializers.Serializer):
    episode = serializers.PrimaryKeyRelatedField(
        queryset=Episode.objects.filter(
            quality__in=("good", "usable"),
        ),
    )
