from django.urls import path

from .views import LiveMarketPriceView
from .views import (
    FarmingAdviceView
)

urlpatterns = [

    path(
        'live-prices/',
        LiveMarketPriceView.as_view()
    ),
    path(
    'farming-advice/',
    FarmingAdviceView.as_view()
),
    
]