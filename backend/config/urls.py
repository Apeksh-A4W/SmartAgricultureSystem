from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def home(request):
    return JsonResponse({
        "message": "Backend Running"
    })


urlpatterns = [

    path('admin/', admin.site.urls),

    path('', home),

    path(
        'api/auth/',
        include('apps.accounts.urls')
    ),

    path(
        'api/weather/',
        include('apps.weather.urls')
    ),
    path(
        'api/ocr/',
        include('apps.ocr_app.urls')
    ),
    path(
    'api/predictions/',
    include('apps.predictions.urls')
),
    path(
        'api/alerts/',
        include('apps.alerts.urls')
    ),
    path(
        'api/reports/',
        include('apps.reports.urls')
    ),
    path(
        'api/market/',
        include('apps.recommendations.urls')
    ),
    path(
        'api/recommendations/',
        include('apps.recommendations.urls')
    ),
    
]