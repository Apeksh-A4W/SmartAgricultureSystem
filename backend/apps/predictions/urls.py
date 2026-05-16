from django.urls import path

from .views import (

    CropPredictionView,

    PredictionHistoryView,

    PredictionAnalyticsView,

    YieldTrendView,

    CropStatisticsView
)


urlpatterns = [

    path(
        'predict/',
        CropPredictionView.as_view(),
        name='predict_crop_yield'
    ),

    path(
        'history/',
        PredictionHistoryView.as_view(),
        name='prediction_history'
    ),

    path(
        'analytics/',
        PredictionAnalyticsView.as_view(),
        name='prediction_analytics'
    ),

    path(
        'yield-trends/',
        YieldTrendView.as_view(),
        name='yield_trends'
    ),

    path(
        'crop-stats/',
        CropStatisticsView.as_view(),
        name='crop_statistics'
    ),
]