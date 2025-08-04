from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from django.core.exceptions import ValidationError
from .models import CustomUser

class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def pre_social_login(self, request, sociallogin):
        """
        This hook is called just after a user successfully authenticates with
        a social provider, but before the login is processed.
        
        We'll use this to connect the social account to an existing user if
        one exists with the same email address.
        """
        # The user object associated with the social login
        user = sociallogin.user
        
        # If the user already has an ID, it means they're already logged in
        # and are just connecting a new social account.
        if user.id:
            return

        # If the social login is already connected to a user, do nothing
        if sociallogin.is_existing:
            return

        # Check if a user exists with the same email address.
        try:
            # Find a user with the same email address.
            existing_user = CustomUser.objects.get(email__iexact=user.email)
            
            # If a user is found, connect the social account to this user.
            sociallogin.connect(request, existing_user)
        except CustomUser.DoesNotExist:
            # If no user with this email exists, the normal signup process will continue.
            pass

    def save_user(self, request, sociallogin, form=None):
        """
        This method is called when a new user is created from a social account.
        We'll use it to populate the custom fields on our CustomUser model.
        """
        user = super().save_user(request, sociallogin, form)
        
        # Populate the 'full_name' field from the social account data.
        # 'name' is a common field provided by most social providers.
        user.full_name = sociallogin.account.extra_data.get('name', '')
        
        # Populate the 'location' field. This is less standard.
        # We'll try to get it from 'locale' (from Google) or another field.
        # Provide a default if it's not available.
        user.location = sociallogin.account.extra_data.get('locale', 'Not specified')
        
        user.save()
        return user