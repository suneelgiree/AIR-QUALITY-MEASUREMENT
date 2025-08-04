from django.contrib import admin
from django.urls import path, include
# --- CORRECTED IMPORT ---
# Import the class-based view, not the old function
from authentication.views import SocialLoginRedirectView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # URLs for django-allauth social login
    path('accounts/', include('allauth.urls')),
    
    # --- CORRECTED URL PATTERN ---
    # Use the class-based view with .as_view()
    path('social-login-redirect/', SocialLoginRedirectView.as_view(), name='social_login_redirect'),
    
    # Include your other app URLs
    # Assuming you have an authentication/urls.py for login, register, etc.
    path('api/auth/', include('authentication.urls')), 
    path('api/air-quality/', include('air_quality.urls')),
]