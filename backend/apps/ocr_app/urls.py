from django.urls import path

from .views import SoilOCRView

urlpatterns = [

    path(
        'extract/',
        SoilOCRView.as_view(),
        name='soil_ocr'
    ),
]