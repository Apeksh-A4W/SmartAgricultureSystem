from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.utils.timezone import now
from datetime import timedelta
import uuid

from .models import EmailVerificationToken, PasswordResetToken

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    confirm_password = serializers.CharField(write_only=True)
    
    preferred_language = serializers.ChoiceField(
        choices=['en', 'kn', 'hi'],
        default='en'
    )

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
            'phone_number',
            'preferred_language'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Passwords do not match"}
            )
        
        # Check if user already exists
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError(
                {"email": "A user with this email already exists"}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        language = validated_data.pop('preferred_language', 'en')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number'),
            preferred_language=language,
            is_email_verified=False
        )
        
        # Create email verification token
        token = str(uuid.uuid4())
        EmailVerificationToken.objects.create(
            user=user,
            token=token,
            expires_at=now() + timedelta(hours=24)
        )
        
        # Send verification email async
        try:
            from tasks import send_email_verification_task
            verification_link = f"http://localhost:3000/verify-email?token={token}"
            send_email_verification_task.delay(user.id, verification_link)
        except ImportError:
            pass

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'phone_number',
            'is_email_verified',
            'preferred_language',
            'created_at'
        ]
        
    def update(self, instance, validated_data):
        if 'preferred_language' in validated_data:
            instance.preferred_language = validated_data['preferred_language']
        instance.save()
        return instance


class VerifyEmailSerializer(serializers.Serializer):
    """Verify email with token"""
    token = serializers.CharField(required=True)
    
    def validate_token(self, value):
        try:
            email_token = EmailVerificationToken.objects.get(token=value)
            if email_token.expires_at < now():
                raise serializers.ValidationError("Verification token has expired")
            return value
        except EmailVerificationToken.DoesNotExist:
            raise serializers.ValidationError("Invalid verification token")


class PasswordResetRequestSerializer(serializers.Serializer):
    """Request password reset with email"""
    email = serializers.EmailField(required=True)
    
    def validate_email(self, value):
        try:
            User.objects.get(email=value)
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email does not exist")


class PasswordResetSerializer(serializers.Serializer):
    """Reset password with token and new password"""
    token = serializers.CharField(required=True)
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Passwords do not match"}
            )
        
        try:
            reset_token = PasswordResetToken.objects.get(token=attrs['token'])
            if reset_token.expires_at < now():
                raise serializers.ValidationError({"token": "Reset token has expired"})
            if reset_token.used:
                raise serializers.ValidationError({"token": "This token has already been used"})
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError({"token": "Invalid reset token"})
        
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    """Change password for authenticated user"""
    old_password = serializers.CharField(write_only=True, required=True)
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "New passwords do not match"}
            )
        return attrs