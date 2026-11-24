from django.urls import path
from . import views

urlpatterns = [
    path("detect/", views.detect_ppe, name="detect_ppe"),
    path("result/<str:id>/", views.get_result, name="get_result"),
]
