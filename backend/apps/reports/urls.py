from django.urls import path

from .views import (

    GenerateWeeklyReportView,

    WeeklyReportHistoryView
)

urlpatterns = [

    path(

        'generate/',

        GenerateWeeklyReportView.as_view()
    ),

    path(

        'history/',

        WeeklyReportHistoryView.as_view()
    ),
]