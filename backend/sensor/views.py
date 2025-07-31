from rest_framework import generics
from sensor.models import AQILog
from sensor.serializers import AQILogSerializer

class AQILogList(generics.ListAPIView):
    queryset = AQILog.objects.all().order_by('-timestamp')
    serializer_class = AQILogSerializer