from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

# Corrected: Removed 'social_login_redirect' from the import list
from .views import (
    CustomTokenObtainPairView,
    UserRegistrationView,
    UserProfileView
)

urlpatterns = [
    # /api/auth/login/
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # /api/auth/login/refresh/
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # /api/auth/register/
    path('register/', UserRegistrationView.as_view(), name='user_register'),
    
    # /api/auth/profile/
    path('profile/', UserProfileView.as_view(), name='user_profile'),
]