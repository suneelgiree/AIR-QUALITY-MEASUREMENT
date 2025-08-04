# --- Imports ---
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import View
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from django.shortcuts import redirect
from urllib.parse import urlencode

from .models import CustomUser
from .serializers import UserRegistrationSerializer, UserProfileSerializer


# =============================================================================
# === CORE API AUTHENTICATION VIEWS ===========================================
# =============================================================================

class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Handles user login. Takes credentials and returns JWT access and refresh tokens.
    Corresponds to the '/login/' endpoint.
    """
    # This view uses the default implementation from Simple JWT but can be
    # customized here if needed in the future.
    pass


class UserRegistrationView(generics.CreateAPIView):
    """
    Handles new user registration.
    On successful registration, it creates the user and returns their profile
    data along with new access and refresh tokens.
    Corresponds to the '/register/' endpoint.
    """
    queryset = CustomUser.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        # Serialize the user data for the response
        user_data = UserProfileSerializer(user).data
        
        # Construct the final response payload
        response_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': user_data
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Handles viewing and updating the authenticated user's profile.
    The user is identified by the JWT token in the Authorization header.
    Corresponds to the '/profile/' endpoint.
    """
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Ensures a user can only ever access their own profile
        return self.request.user


# =============================================================================
# === SOCIAL LOGIN VIEWS ======================================================
# =============================================================================

class SocialLoginRedirectView(View):
    """
    Handles the redirect back from a social provider (e.g., Google).
    If the user is authenticated by django-allauth, this view generates
    JWT tokens and redirects them to the frontend application with the
    tokens in the URL parameters.
    """
    def get(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            # Redirect to the frontend login page with an error if auth fails
            error_params = urlencode({'error': 'AuthenticationFailed'})
            return redirect(f"{settings.FRONTEND_LOGIN_URL}?{error_params}")

        # Generate JWT tokens for the authenticated user
        refresh = RefreshToken.for_user(request.user)
        
        # Prepare tokens for the redirect URL
        token_params = urlencode({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
        
        # Redirect to the frontend dashboard, passing tokens as query parameters
        return redirect(f'{settings.FRONTEND_DASHBOARD_URL}?{token_params}')