from django.db import models
from django.conf import settings


class WeeklyReport(models.Model):

    user = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='weekly_reports'
    )

    title = models.CharField(
        max_length=255
    )

    crop_name = models.CharField(
        max_length=255
    )

    predicted_yield = models.FloatField()

    weather_summary = models.TextField()

    alert_summary = models.TextField()

    ai_recommendations = models.JSONField(
        default=list
    )

    risk_level = models.CharField(
        max_length=50,
        default='LOW'
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:

        ordering = ['-created_at']

    def __str__(self):

        return (
            f"{self.crop_name} Report"
        )