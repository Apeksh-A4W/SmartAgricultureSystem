from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


def default_expires_at():
    return timezone.now() + timedelta(days=7)


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
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    expires_at = models.DateTimeField(default=default_expires_at)

    read_by_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='read_alerts',
        blank=True
    )

    dismissed_by_users = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='dismissed_alerts',
        blank=True
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.alert_type} - {self.severity}"

    def is_expired(self):
        return timezone.now() > self.expires_at

    def mark_as_read_by(self, user):
        self.read_by_users.add(user)

    def dismiss_for_user(self, user):
        self.dismissed_by_users.add(user)


class AlertNotification(models.Model):
    """Track notifications sent to users about alerts"""

    alert = models.ForeignKey(
        CommunityAlert,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='alert_notifications'
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('alert', 'user')
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username} - Alert {self.alert.id}"