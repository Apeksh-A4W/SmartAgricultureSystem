from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from django.contrib.auth import authenticate
from django.utils.timezone import now
from datetime import timedelta
import uuid

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    VerifyEmailSerializer,
    PasswordResetRequestSerializer,
    PasswordResetSerializer,
    ChangePasswordSerializer
)
from .models import User, EmailVerificationToken, PasswordResetToken


class RegisterView(APIView):
    """
    Register new user with email verification
    POST /api/auth/register/
    """

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "User registered successfully. Please check your email to verify.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            }, status=status.HTTP_201_CREATED)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class LoginView(APIView):
    """
    Login with username/email and password
    POST /api/auth/login/
    """

    def post(self, request):

        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(
            username=username,
            password=password
        )

        if user is not None:
            
            # Check if email is verified
            if not user.is_email_verified:
                return Response({
                    "error": "Please verify your email before logging in",
                    "email_verified": False
                }, status=status.HTTP_403_FORBIDDEN)

            refresh = RefreshToken.for_user(user)

            return Response({
                "message": "Login successful",
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            })

        return Response({
            "error": "Invalid credentials"
        }, status=status.HTTP_401_UNAUTHORIZED)


class VerifyEmailView(APIView):
    """
    Verify email with token
    POST /api/auth/verify-email/
    """

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                email_token = EmailVerificationToken.objects.get(
                    token=serializer.validated_data['token']
                )
                
                user = email_token.user
                user.is_email_verified = True
                user.email_verified_at = now()
                user.save()
                
                email_token.delete()
                
                return Response({
                    "message": "Email verified successfully",
                    "user": UserSerializer(user).data
                })
            except EmailVerificationToken.DoesNotExist:
                return Response({
                    "error": "Verification token not found"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResendVerificationEmailView(APIView):
    """
    Resend verification email
    POST /api/auth/resend-verification/
    """

    def post(self, request):
        email = request.data.get('email')
        
        if not email:
            return Response({
                "error": "Email is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
            
            if user.is_email_verified:
                return Response({
                    "message": "Email is already verified"
                })
            
            # Delete existing token
            EmailVerificationToken.objects.filter(user=user).delete()
            
            # Create new token
            token = str(uuid.uuid4())
            EmailVerificationToken.objects.create(
                user=user,
                token=token,
                expires_at=now() + timedelta(hours=24)
            )
            
            # Send verification email async
            from django_q.tasks import async_task
            from tasks import send_email_verification_task
            verification_link = f"http://localhost:3000/verify-email?token={token}"
            async_task(send_email_verification_task, user.id, verification_link)
            
            return Response({
                "message": "Verification email sent successfully"
            })
        
        except User.DoesNotExist:
            # Don't reveal if email exists
            return Response({
                "message": "If the email exists, a verification link has been sent"
            })


class PasswordResetRequestView(APIView):
    """
    Request password reset (sends email with reset link)
    POST /api/auth/password-reset/
    """

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                user = User.objects.get(email=serializer.validated_data['email'])
                
                # Delete existing reset tokens
                PasswordResetToken.objects.filter(user=user, used=False).delete()
                
                # Create new reset token
                token = str(uuid.uuid4())
                PasswordResetToken.objects.create(
                    user=user,
                    token=token,
                    expires_at=now() + timedelta(hours=1)
                )
                
                # Send password reset email async
                from django_q.tasks import async_task
                from tasks import send_password_reset_task
                reset_link = f"http://localhost:3000/reset-password?token={token}"
                async_task(send_password_reset_task, user.id, reset_link)
                
                return Response({
                    "message": "Password reset link has been sent to your email"
                })
            
            except User.DoesNotExist:
                # Don't reveal if email exists
                return Response({
                    "message": "If the email exists, a password reset link has been sent"
                })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetView(APIView):
    """
    Reset password with token
    POST /api/auth/password-reset-confirm/
    """

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                reset_token = PasswordResetToken.objects.get(
                    token=serializer.validated_data['token']
                )
                
                user = reset_token.user
                user.set_password(serializer.validated_data['password'])
                user.save()
                
                # Mark token as used
                reset_token.used = True
                reset_token.used_at = now()
                reset_token.save()
                
                return Response({
                    "message": "Password reset successfully"
                })
            
            except PasswordResetToken.DoesNotExist:
                return Response({
                    "error": "Reset token not found"
                }, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ChangePasswordView(APIView):
    """
    Change password for authenticated user
    POST /api/auth/change-password/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        
        if serializer.is_valid():
            user = request.user
            
            # Verify old password
            if not user.check_password(serializer.validated_data['old_password']):
                return Response({
                    "error": "Old password is incorrect"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                "message": "Password changed successfully"
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """
    Get/Update user profile
    GET /api/auth/profile/
    PUT /api/auth/profile/
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Profile updated successfully",
                "user": serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    Logout by blacklisting refresh token
    POST /api/auth/logout/
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):

        try:
            refresh_token = request.data["refresh"]

            token = RefreshToken(refresh_token)

            token.blacklist()

            return Response({
                "message": "Logout successful"
            })

        except Exception:
            return Response({
                "error": "Invalid token"
            }, status=status.HTTP_400_BAD_REQUEST)


class GoogleLoginView(APIView):
    """
    Google OAuth login - verifies Google credential and returns JWT tokens
    POST /api/auth/google/
    
    Request body:
    {
        "credential": "<Google JWT token from frontend>"
    }
    """

    def post(self, request):
        """
        Verify Google credential token and authenticate user
        """
        credential = request.data.get('credential')
        
        if not credential:
            return Response({
                "error": "credential field is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify the Google token
            from google.auth.transport import requests
            from google.oauth2 import id_token
            import os
            
            # Get Google Client ID from environment
            google_client_id = os.getenv('GOOGLE_CLIENT_ID', '')
            
            if not google_client_id:
                return Response({
                    "error": "Google OAuth not configured on server"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Verify the credential token
            id_info = id_token.verify_oauth2_token(
                credential,
                requests.Request(),
                google_client_id
            )
            
            # Extract user info from token
            google_id = id_info.get('sub')
            email = id_info.get('email')
            first_name = id_info.get('given_name', '')
            last_name = id_info.get('family_name', '')
            picture = id_info.get('picture', '')
            
            if not email:
                return Response({
                    "error": "Email not found in Google token"
                }, status=status.HTTP_400_BAD_REQUEST)
            
           # Build a unique username from email prefix
            base_username = email.split('@')[0]
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Find or create user
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': username,
                    'first_name': first_name,
                    'last_name': last_name,
                    'oauth_provider': 'google',
                    'oauth_id': google_id,
                    'is_email_verified': True,
                    'email_verified_at': now()
                }
            )
            
            # Update existing user's OAuth info
            if not created:
                if not user.oauth_provider:
                    user.oauth_provider = 'google'
                    user.oauth_id = google_id
                    user.is_email_verified = True
                    if not user.email_verified_at:
                        user.email_verified_at = now()
                    user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "Google login successful",
                "user": UserSerializer(user).data,
                "tokens": {
                    "access": str(refresh.access_token),
                    "refresh": str(refresh)
                }
            }, status=status.HTTP_200_OK)
        
        except ValueError as e:
            # Token verification failed
            return Response({
                "error": f"Invalid or expired Google token: {str(e)}"
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        except Exception as e:
            # Other errors
            return Response({
                "error": f"Authentication failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
