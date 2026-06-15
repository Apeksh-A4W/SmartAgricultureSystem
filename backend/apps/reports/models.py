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


class EmailLog(models.Model):
    """Track all emails sent to users"""
    
    EMAIL_TYPES = [
        ('verification', 'Email Verification'),
        ('password_reset', 'Password Reset'),
        ('weekly_report', 'Weekly Report'),
        ('recommendation', 'Daily Recommendation'),
        ('alert_notification', 'Alert Notification'),
        ('report_export', 'Report Export'),
    ]
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_logs'
    )
    
    email_to = models.EmailField()
    subject = models.CharField(max_length=255)
    email_type = models.CharField(max_length=50, choices=EMAIL_TYPES)
    
    sent_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=[('sent', 'Sent'), ('failed', 'Failed'), ('bounced', 'Bounced')],
        default='sent'
    )
    
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"{self.email_type} to {self.email_to}"


class ReportHistory(models.Model):
    """Track report generation and viewing history"""
    
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='report_history'
    )
    report = models.ForeignKey(
        WeeklyReport,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    action = models.CharField(
        max_length=50,
        choices=[
            ('generated', 'Generated'),
            ('viewed', 'Viewed'),
            ('downloaded', 'Downloaded'),
            ('emailed', 'Emailed'),
            ('exported', 'Exported')
        ]
    )
    
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.action} by {self.user.username}"