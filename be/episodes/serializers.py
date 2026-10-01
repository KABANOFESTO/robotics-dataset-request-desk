from rest_framework import serializers

from .models import Episode


class EpisodeSerializer(serializers.ModelSerializer):
    assigned = serializers.SerializerMethodField()

    class Meta:
        model = Episode
        fields = (
            "id",
            "episode_id",
            "robot_id",
            "task_name",
            "recorded_at",
            "duration_seconds",
            "operator_name",
            "quality",
            "assigned",
        )
        read_only_fields = fields

    def get_assigned(self, episode):
        return hasattr(episode, "assignment")
