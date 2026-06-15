
class RecommendationService:

    @staticmethod
    def generate_recommendations(data, prediction):
        recommendations = []

        nitrogen = float(data.get("nitrogen", 0) or 0)
        phosphorus = float(data.get("phosphorus", 0) or 0)
        potassium = float(data.get("potassium", 0) or 0)
        temperature = float(data.get("temperature_celsius", 0) or 0)
        humidity = float(data.get("humidity", 0) or 0)
        rainfall = float(data.get("rainfall_mm", 0) or 0)
        fertilizer_used = bool(data.get("fertilizer_used"))
        irrigation_used = bool(data.get("irrigation_used"))
        weather = str(
            data.get("weather_condition")
            or data.get("weather")
            or ""
        ).lower()
        crop_type = str(data.get("crop_type") or "general").lower()

        if nitrogen < 2:
            recommendations.append(
                {
                    "title": "Nitrogen level is low.",
                    "details": "Apply urea or a nitrogen-rich fertilizer to support leaf development.",
                    "severity": "warning",
                    "confidence": 92,
                    "category": "Nutrition",
                    "priority": 1,
                }
            )

        if phosphorus < 2:
            recommendations.append(
                {
                    "title": "Phosphorus needs are below optimal.",
                    "details": "Consider a phosphorus-rich supplement to improve root growth and bloom development.",
                    "severity": "info",
                    "confidence": 88,
                    "category": "Nutrition",
                    "priority": 2,
                }
            )

        if potassium < 2:
            recommendations.append(
                {
                    "title": "Potassium levels are low.",
                    "details": "A potassium-rich fertilizer will strengthen overall plant health and stress tolerance.",
                    "severity": "info",
                    "confidence": 87,
                    "category": "Nutrition",
                    "priority": 2,
                }
            )

        if not fertilizer_used:
            recommendations.append(
                {
                    "title": "Fertilizer usage is low.",
                    "details": "Balanced fertilizer use can improve yield and reduce nutrient stress.",
                    "severity": "warning",
                    "confidence": 90,
                    "category": "Fertilizer",
                    "priority": 1,
                }
            )

        if not irrigation_used:
            recommendations.append(
                {
                    "title": "Irrigation is recommended.",
                    "details": "Ensure regular watering to maintain healthy moisture levels during crop development.",
                    "severity": "warning",
                    "confidence": 91,
                    "category": "Irrigation",
                    "priority": 1,
                }
            )

        if "rain" in weather or "drizzle" in weather:
            recommendations.append(
                {
                    "title": "Rain expected soon.",
                    "details": "Temporary irrigation reduction is advised and watch for waterlogging.",
                    "severity": "info",
                    "confidence": 85,
                    "category": "Weather",
                    "priority": 3,
                }
            )

        if humidity >= 75:
            recommendations.append(
                {
                    "title": "High humidity may increase disease risk.",
                    "details": "Monitor for fungal infections and avoid overhead irrigation in the evening.",
                    "severity": "danger",
                    "confidence": 89,
                    "category": "Risk",
                    "priority": 1,
                }
            )

        if temperature >= 35:
            recommendations.append(
                {
                    "title": "Heat stress is possible.",
                    "details": "Increase shade, mulching, and irrigation frequency to protect young crops.",
                    "severity": "danger",
                    "confidence": 90,
                    "category": "Weather",
                    "priority": 1,
                }
            )
        elif temperature <= 18:
            recommendations.append(
                {
                    "title": "Cool temperatures detected.",
                    "details": "Protect sensitive crops from cold stress and avoid heavy fertilization at low temperatures.",
                    "severity": "warning",
                    "confidence": 82,
                    "category": "Weather",
                    "priority": 3,
                }
            )

        if rainfall < 30:
            recommendations.append(
                {
                    "title": "Rainfall is low.",
                    "details": "Use moisture conservation or drip irrigation to keep the root zone stable.",
                    "severity": "warning",
                    "confidence": 88,
                    "category": "Irrigation",
                    "priority": 2,
                }
            )

        if prediction >= 3.5:
            recommendations.append(
                {
                    "title": "Predicted yield is strong.",
                    "details": "Crop performance looks good. Continue current management and monitor for pests.",
                    "severity": "success",
                    "confidence": 94,
                    "category": "Yield",
                    "priority": 4,
                }
            )
        elif prediction >= 2:
            recommendations.append(
                {
                    "title": "Yield forecast is moderate.",
                    "details": "Focus on nutrient balance and irrigation timing to push performance higher.",
                    "severity": "info",
                    "confidence": 86,
                    "category": "Yield",
                    "priority": 3,
                }
            )
        else:
            recommendations.append(
                {
                    "title": "Predicted yield is below target.",
                    "details": "Increase soil health inputs and adjust irrigation to improve yield potential.",
                    "severity": "danger",
                    "confidence": 92,
                    "category": "Yield",
                    "priority": 1,
                }
            )

        if crop_type and crop_type != "general":
            recommendations.append(
                {
                    "title": "Crop-specific focus recommended.",
                    "details": f"Review best practices for {crop_type} and align fertilizer and irrigation accordingly.",
                    "severity": "info",
                    "confidence": 80,
                    "category": "Crop",
                    "priority": 3,
                }
            )

        if len(recommendations) < 5:
            recommendations.append(
                {
                    "title": "Crop conditions are stable.",
                    "details": "Continue monitoring soil moisture, weather, and nutrient levels for consistent growth.",
                    "severity": "info",
                    "confidence": 75,
                    "category": "General",
                    "priority": 5,
                }
            )

        return recommendations