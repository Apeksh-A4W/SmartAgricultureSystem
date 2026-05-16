import cv2
import pytesseract
import re
import numpy as np

pytesseract.pytesseract.tesseract_cmd = (
    r"C:\Program Files\Tesseract-OCR\tesseract.exe"
)


class OCRService:

    @staticmethod
    def preprocess_image(image_path):

        image = cv2.imread(image_path)

        image = cv2.resize(
            image,
            None,
            fx=3,
            fy=3,
            interpolation=cv2.INTER_CUBIC
        )

        gray = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2GRAY
        )

        # Contrast enhancement
        gray = cv2.equalizeHist(gray)

        # Bilateral filter preserves edges
        gray = cv2.bilateralFilter(
            gray,
            11,
            17,
            17
        )

        edged = cv2.Canny(
            gray,
            30,
            200
        )

        return image, gray, edged

    @staticmethod
    def find_text_regions(image, edged):

        contours, _ = cv2.findContours(
            edged,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        candidate_regions = []

        for contour in contours:

            x, y, w, h = cv2.boundingRect(contour)

            aspect_ratio = w / float(h)

            area = w * h

            # Text-like regions
            if (
                aspect_ratio > 2 and
                area > 1000 and
                h > 20
            ):

                roi = image[
                    y:y+h,
                    x:x+w
                ]

                candidate_regions.append(roi)

        return candidate_regions

    @staticmethod
    def extract_text(image_path):

        image, gray, edged = OCRService.preprocess_image(
            image_path
        )

        regions = OCRService.find_text_regions(
            image,
            edged
        )

        full_text = ""

        config = r'--oem 3 --psm 7'

        for roi in regions:

            roi_gray = cv2.cvtColor(
                roi,
                cv2.COLOR_BGR2GRAY
            )

            roi_thresh = cv2.adaptiveThreshold(
                roi_gray,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                11,
                2
            )

            text = pytesseract.image_to_string(
                roi_thresh,
                config=config
            )

            full_text += "\n" + text

        print("\n===== OCR TEXT =====\n")
        print(full_text)

        return full_text

    @staticmethod
    def extract_npk_values(text):

        patterns = [

            r'NPK\s*(\d{1,2})[:\-\.](\d{1,2})[:\-\.](\d{1,2})',

            r'(\d{1,2})[:\-\.](\d{1,2})[:\-\.](\d{1,2})',

            r'(\d{1,2})\s+(\d{1,2})\s+(\d{1,2})'
        ]

        for pattern in patterns:

            match = re.search(
                pattern,
                text,
                re.IGNORECASE
            )

            if match:

                return {

                    "nitrogen": int(match.group(1)),

                    "phosphorus": int(match.group(2)),

                    "potassium": int(match.group(3))
                }

        return {

            "nitrogen": None,

            "phosphorus": None,

            "potassium": None
        }