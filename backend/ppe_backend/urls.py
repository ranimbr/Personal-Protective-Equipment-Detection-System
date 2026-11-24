from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView

urlpatterns = [
    # Racine "/" sert index.html
    path("", TemplateView.as_view(template_name="index.html")),

    # API pour détection PPE
    path("api/", include("detection_app.urls")),

    # Page result (template statique, servie par Django)
    path("result.html", TemplateView.as_view(template_name="result.html")),
]

# Servir les fichiers media
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
