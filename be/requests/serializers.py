from rest_framework import serializers

from episodes.models import Episode

from .models import Assignment, DatasetRequest, RequestStatus, RequestStatusHistory


class AssignmentSerializer(serializers.ModelSerializer):
    episode_code = serializers.CharField(source="episode.episode_id", read_only=True)
    episode_quality = serializers.CharField(source="episode.quality", read_only=True)

    class Meta:
        model = Assignment
        fields = (
            "id",
            "episode",
            "episode_code",
            "episode_quality",
            "assigned_by",
            "assigned_at",
        )
        read_only_fields = ("id", "assigned_by", "assigned_at")


class RequestStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_email = serializers.EmailField(
        source="changed_by.email",
        read_only=True,
    )

    class Meta:
        model = RequestStatusHistory
        fields = (
            "id",
            "from_status",
            "to_status",
            "changed_by",
            "changed_by_email",
            "changed_at",
        )
        read_only_fields = fields


class DatasetRequestSerializer(serializers.ModelSerializer):
    client = serializers.PrimaryKeyRelatedField(read_only=True)
    client_email = serializers.EmailField(source="client.email", read_only=True)
    client_name = serializers.SerializerMethodField()
    assignments = AssignmentSerializer(many=True, read_only=True)
    status_history = RequestStatusHistorySerializer(many=True, read_only=True)

    def get_client_name(self, obj):
        name = f"{obj.client.first_name} {obj.client.last_name}".strip()
        return name or obj.client.email

    class Meta:
        model = DatasetRequest
        fields = (
            "id",
            "client",
            "client_email",
            "client_name",
            "task_name",
            "episodes_requested",
            "deadline",
            "notes",
            "status",
            "assignments",
            "status_history",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "client",
            "status",
            "assignments",
            "status_history",
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
