from django.urls import path

from .views import (
    ReportAlertView,
    NearbyAlertsView,
    AlertAnalyticsView,
    AlertDetailView,
    DismissAlertView,
    UserAlertsView
)


urlpatterns = [

    path(
        'report/',
        ReportAlertView.as_view(),
        name='report_alert'
    ),

    path(
        'nearby/',
        NearbyAlertsView.as_view(),
        name='nearby_alerts'
    ),

    path(
        'my-alerts/',
        UserAlertsView.as_view(),
        name='user_alerts'
    ),

    path(
        '<int:alert_id>/',
        AlertDetailView.as_view(),
        name='alert_detail'
    ),

    path(
        '<int:alert_id>/dismiss/',
        DismissAlertView.as_view(),
        name='dismiss_alert'
    ),

    path(
        'analytics/',
        AlertAnalyticsView.as_view(),
        name='alert_analytics'
    ),
]