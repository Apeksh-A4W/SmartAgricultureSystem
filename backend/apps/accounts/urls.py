from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    RegisterView,
    LoginView,
    ProfileView,
    LogoutView,
    VerifyEmailView,
    ResendVerificationEmailView,
    PasswordResetRequestView,
    PasswordResetView,
    ChangePasswordView,
    GoogleLoginView
)

urlpatterns = [

    path(
        'register/',
        RegisterView.as_view(),
        name='register'
    ),
    path(
        'login/',
        LoginView.as_view(),
        name='login'
    ),
    path(
        'refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
    path(
        'verify-email/',
        VerifyEmailView.as_view(),
        name='verify_email'
    ),
    path(
        'resend-verification/',
        ResendVerificationEmailView.as_view(),
        name='resend_verification'
    ),
    path(
        'password-reset/',
        PasswordResetRequestView.as_view(),
        name='password_reset_request'
    ),
    path(
        'password-reset-confirm/',
        PasswordResetView.as_view(),
        name='password_reset_confirm'
    ),
    path(
        'change-password/',
        ChangePasswordView.as_view(),
        name='change_password'
    ),
    path(
        'profile/',
        ProfileView.as_view(),
        name='profile'
    ),
    path(
        'logout/',
        LogoutView.as_view(),
        name='logout'
    ),
    path(
        'google/',
        GoogleLoginView.as_view(),
        name='google_login'
    ),
]