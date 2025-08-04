from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
import secrets
# --- Import geopy ---
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderUnavailable

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("The email must be set.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True)
    location = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(default=timezone.now)
    api_key = models.CharField(max_length=64, unique=True, null=True, blank=True, editable=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        # --- ADDED: Geocoding logic ---
        # Check if the location field has a value and if coordinates are missing
        if self.location and (self.latitude is None or self.longitude is None):
            geolocator = Nominatim(user_agent="air_quality_app") # user_agent is required
            try:
                location_data = geolocator.geocode(self.location)
                if location_data:
                    self.latitude = location_data.latitude
                    self.longitude = location_data.longitude
            except (GeocoderTimedOut, GeocoderUnavailable):
                # Handle cases where the geocoding service is unavailable
                # You could log this error or try again later. For now, we'll just pass.
                pass
        
        if not self.api_key:
            self.api_key = secrets.token_hex(32)
        
        super().save(*args, **kwargs)