from django.contrib.auth.models import AbstractUser
from django.db import models
import uuid


class User(AbstractUser):
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    
    # Email verification
    is_email_verified = models.BooleanField(default=False)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    
    # User preferences
    preferred_language = models.CharField(
        max_length=10,
        choices=[('en', 'English'), ('kn', 'Kannada'), ('hi', 'Hindi')],
        default='en'
    )
    
    # OAuth provider tracking
    oauth_provider = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        choices=[('google', 'Google'), ('facebook', 'Facebook')]
    )
    oauth_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    # Location for alert radius calculations
    latitude = models.FloatField(null=True, blank=True, help_text="User farm/location latitude")
    longitude = models.FloatField(null=True, blank=True, help_text="User farm/location longitude")

    def __str__(self):
        return self.username


class EmailVerificationToken(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='email_verification_token')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    expires_at = models.DateTimeField()
    
    def __str__(self):
        return f"Email verification token for {self.user.email}"
    
    class Meta:
        verbose_name = "Email Verification Token"
        verbose_name_plural = "Email Verification Tokens"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Password reset token for {self.user.username}"
    
    class Meta:
        verbose_name = "Password Reset Token"
        verbose_name_plural = "Password Reset Tokens"
        ordering = ['-created_at']
   
