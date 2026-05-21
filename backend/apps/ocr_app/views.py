import os

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.conf import settings
from django.core.files.storage import default_storage

from services.ocr_service import OCRService

from .serializers import SoilReportUploadSerializer


class SoilOCRView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = SoilReportUploadSerializer(data=request.data)

        if serializer.is_valid():

            image = serializer.validated_data['image']

            image_path = default_storage.save(
                f"soil_reports/{image.name}",
                image
            )

            full_path = os.path.join(
                settings.MEDIA_ROOT,
                image_path
            )

            extracted_text = OCRService.extract_text(full_path)

            npk_values = OCRService.extract_npk_values(
                extracted_text
            )

            return Response({

                "message": "OCR extraction successful",

                "nitrogen": npk_values.get("nitrogen", 0),

                "phosphorus": npk_values.get("phosphorus", 0),

                "potassium": npk_values.get("potassium", 0),

                "raw_text": extracted_text
            })

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )