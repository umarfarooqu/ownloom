from django.contrib import admin
from django.urls import path, include
from rest_framework.authtoken.views import obtain_auth_token # Import this

from django.conf import settings
from django.conf.urls.static import static
# 9 sep
from api.views import PublicFileView


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('api-token-auth/', obtain_auth_token, name='api_token_auth'), # Add this line
    #  9 sep
    path('shared/<uuid:token>/', PublicFileView.as_view(), name='public-file'),
    path('api/password-reset/', include('django_rest_passwordreset.urls', namespace='password_reset')),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)