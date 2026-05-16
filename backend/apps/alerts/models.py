from django.db import models
from django.conf import settings


class CommunityAlert(models.Model):

    ALERT_TYPES = [

        ('PEST', 'Pest Attack'),

        ('ANIMAL', 'Wild Animal'),

        ('DISEASE', 'Disease'),

        ('WEATHER', 'Weather Damage')
    ]

    SEVERITY_CHOICES = [

        ('DANGER', 'Danger'),

        ('WARNING', 'Warning'),

        ('SAFE', 'Safe')
    ]

    user = models.ForeignKey(

        settings.AUTH_USER_MODEL,

        on_delete=models.CASCADE,

        related_name='community_alerts'
    )

    alert_type = models.CharField(

        max_length=50,

        choices=ALERT_TYPES
    )

    severity = models.CharField(

        max_length=50,

        choices=SEVERITY_CHOICES
    )

    description = models.TextField()

    image = models.ImageField(

        upload_to='alerts/',

        blank=True,

        null=True
    )

    latitude = models.FloatField()

    longitude = models.FloatField()

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:

        ordering = ['-created_at']

    def __str__(self):

        return (
            f"{self.alert_type} - "
            f"{self.severity}"
        )