from django.core.management.base import BaseCommand
from django.utils import timezone

# --- CORRECTED IMPORT ---
# Import from the single source of truth: models.py
from air_quality.models import AirQualityReading, AQIForecast, ForecastDataPoint
from prediction import predictor_service

class Command(BaseCommand):
    help = 'Generates a 7-day AQI forecast based on the latest available air quality reading.'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting 7-day forecast generation process..."))

        try:
            # Use the latest reading as the baseline for the forecast
            latest_reading = AirQualityReading.objects.latest('timestamp')
            self.stdout.write(self.style.SUCCESS(f"Using latest reading from {latest_reading.timestamp} as baseline."))
        except AirQualityReading.DoesNotExist:
            self.stdout.write(self.style.ERROR("No air quality readings found in the database. Cannot generate forecast."))
            return

        # Call the prediction service to get the forecast data
        forecast_data = predictor_service.generate_7_day_forecast(reading=latest_reading)

        if forecast_data is not None and not forecast_data.empty:
            # Create the main forecast object
            new_forecast = AQIForecast.objects.create(
                latitude=latest_reading.latitude,
                longitude=latest_reading.longitude
            )

            # Create the individual data points for each day of the forecast
            points_created = 0
            for index, row in forecast_data.iterrows():
                ForecastDataPoint.objects.create(
                    forecast=new_forecast,
                    date=row['date'],
                    predicted_aqi=row['predicted_aqi']
                )
                points_created += 1

            self.stdout.write(self.style.SUCCESS(
                f"Successfully generated and saved new 7-day forecast with {points_created} data points."
            ))
        else:
            self.stdout.write(self.style.WARNING("Prediction service did not return any forecast data."))