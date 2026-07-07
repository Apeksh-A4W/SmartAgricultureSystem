from django.test import TestCase

from services.ocr_service import OCRService


class OCRServiceTests(TestCase):
    def test_extract_text_returns_empty_string_for_missing_image(self):
        missing_path = "missing-image.png"

        text = OCRService.extract_text(missing_path)

        self.assertEqual(text, "")
