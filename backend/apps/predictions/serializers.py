from rest_framework import serializers

from .models import CropPrediction


class CropPredictionSerializer(serializers.ModelSerializer):

    class Meta:

        model = CropPrediction

        fields = '__all__'

        read_only_fields = [
            'user',
            'predicted_yield',
            'created_at'
        ]