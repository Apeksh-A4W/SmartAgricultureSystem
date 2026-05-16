from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User

        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
            'phone_number'
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError(
                {"password": "Passwords do not match"}
            )

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            phone_number=validated_data.get('phone_number')
        )

        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User

        fields = [
            'id',
            'username',
            'email',
            'phone_number'
        ]
