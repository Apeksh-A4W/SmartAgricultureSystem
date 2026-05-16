from rest_framework import serializers

from .models import CommunityAlert


class CommunityAlertSerializer(
    serializers.ModelSerializer
):

    image_url = serializers.SerializerMethodField()

    class Meta:

        model = CommunityAlert

        fields = [

            'id',
            'alert_type',
            'severity',
            'description',
            'image',
            'image_url',
            'latitude',
            'longitude',
            'is_active',
            'created_at',
            'user'
        ]

        read_only_fields = [

            'user',
            'created_at',
            'is_active'
        ]

    def get_image_url(self, obj):

        request = self.context.get('request')

        if obj.image:

            return request.build_absolute_uri(
                obj.image.url
            )

        return None