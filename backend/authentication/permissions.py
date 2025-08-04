from rest_framework.permissions import BasePermission
from .models import CustomUser

class HasAPIKey(BasePermission):
    """
    Allows access only to users who provide a valid API key in the headers.
    Crucially, it also attaches the corresponding user to the request object.
    """
    message = 'Invalid or missing API Key.'

    def has_permission(self, request, view):
        provided_key = request.headers.get('API-Key')
        if not provided_key:
            return False
        
        try:
            # Find the user associated with the provided key
            user = CustomUser.objects.get(api_key=provided_key)
            # Attach the user to the request for use in the view
            request.user = user
            return True
        except CustomUser.DoesNotExist:
            return False