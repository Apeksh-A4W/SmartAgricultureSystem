from django.db import models
from django.conf import settings


class CropPrediction(models.Model):

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='predictions'
    )

    region = models.CharField(max_length=100)

    soil_type = models.CharField(max_length=100)

    crop = models.CharField(max_length=100)

    rainfall_mm = models.FloatField()

    temperature_celsius = models.FloatField()

    fertilizer_used = models.BooleanField()

    irrigation_used = models.BooleanField()

    weather_condition = models.CharField(max_length=100)

    days_to_harvest = models.IntegerField()

    predicted_yield = models.FloatField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:

        ordering = ['-created_at']

    def __str__(self):

        return (
            f"{self.crop} - "
            f"{self.predicted_yield}"
        )