from datetime import datetime, time, timedelta

from django.db import connection
from django.db.models import Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import serializers

from episodes.models import Episode, EpisodeQuality

from .models import DatasetRequest, RequestStatus, RequestStatusHistory


class AnalyticsQuerySerializer(serializers.Serializer):
    start_date = serializers.DateField(required=True)
    end_date = serializers.DateField(required=True)

    def validate(self, attrs):
        if attrs["end_date"] < attrs["start_date"]:
            raise serializers.ValidationError(
                {"end_date": "end_date must be on or after start_date."}
            )
        return attrs


def date_bounds(start_date, end_date):
    start = timezone.make_aware(datetime.combine(start_date, time.min))
    end = timezone.make_aware(datetime.combine(end_date + timedelta(days=1), time.min))
    return start, end


def episodes_per_day(start, end):
    rows = (
        Episode.objects.filter(recorded_at__gte=start, recorded_at__lt=end)
        .annotate(day=TruncDate("recorded_at"))
        .values("day", "robot_id")
        .annotate(count=Count("id"))
        .order_by("day", "robot_id")
    )
    return [
        {
            "date": row["day"].isoformat(),
            "robot_id": row["robot_id"],
            "count": row["count"],
        }
        for row in rows
    ]


def request_fulfillment(start, end):
    counts = (
        DatasetRequest.objects.filter(created_at__gte=start, created_at__lt=end)
        .values("status")
        .annotate(count=Count("id"))
        .order_by("status")
    )
    count_by_status = {row["status"]: row["count"] for row in counts}
    return [
        {"status": status.value, "count": count_by_status.get(status.value, 0)}
        for status in RequestStatus
    ]


def median_submitted_to_delivered(start, end):
    request_table = DatasetRequest._meta.db_table
    history_table = RequestStatusHistory._meta.db_table
    params = [start, end, RequestStatus.DELIVERED]

    if connection.vendor == "postgresql":
        sql = f"""
            SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
                ORDER BY EXTRACT(
                    EPOCH FROM (
                        delivered_requests.delivered_at
                        - delivered_requests.created_at
                    )
                )
            )
            FROM (
                SELECT request.created_at, MIN(history.changed_at) AS delivered_at
                FROM {request_table} AS request
                INNER JOIN {history_table} AS history
                    ON history.request_id = request.id
                WHERE request.created_at >= %s
                  AND request.created_at < %s
                  AND history.to_status = %s
                GROUP BY request.id, request.created_at
            ) AS delivered_requests
        """
    else:
        sql = f"""
            WITH durations AS (
                SELECT
                    (julianday(MIN(history.changed_at))
                        - julianday(request.created_at))
                        * 86400.0 AS seconds,
                    request.id
                FROM {request_table} AS request
                INNER JOIN {history_table} AS history
                    ON history.request_id = request.id
                WHERE request.created_at >= %s
                  AND request.created_at < %s
                  AND history.to_status = %s
                GROUP BY request.id, request.created_at
            ), ranked AS (
                SELECT
                    seconds,
                    ROW_NUMBER() OVER (ORDER BY seconds) AS row_number,
                    COUNT(*) OVER () AS total_rows
                FROM durations
            )
            SELECT AVG(seconds)
            FROM ranked
            WHERE row_number IN ((total_rows + 1) / 2, (total_rows + 2) / 2)
        """

    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        value = cursor.fetchone()[0]
    return round(float(value), 3) if value is not None else None


def top_good_tasks(start, end):
    rows = (
        Episode.objects.filter(
            recorded_at__gte=start,
            recorded_at__lt=end,
            quality=EpisodeQuality.GOOD,
        )
        .values("task_name")
        .annotate(count=Count("id"))
        .order_by("-count", "task_name")[:5]
    )
    return [{"task_name": row["task_name"], "count": row["count"]} for row in rows]
