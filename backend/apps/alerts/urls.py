from django.urls import path

from .views import (

    ReportAlertView,

    NearbyAlertsView,

    AlertAnalyticsView
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
        'analytics/',
        AlertAnalyticsView.as_view(),
        name='alert_analytics'
    ),
]