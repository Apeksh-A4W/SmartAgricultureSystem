class RecommendationService:

    @staticmethod
    def generate_recommendations(data, prediction):

        recommendations = []

        if prediction < 3:

            recommendations.append(
                "Predicted yield is low. Improve irrigation and fertilizer usage."
            )

        if data['temperature_celsius'] > 35:

            recommendations.append(
                "High temperature detected. Increase irrigation frequency."
            )

        if data['rainfall_mm'] < 100:

            recommendations.append(
                "Low rainfall expected. Consider water conservation methods."
            )

        if not data['fertilizer_used']:

            recommendations.append(
                "Fertilizer usage may improve crop yield."
            )

        if not data['irrigation_used']:

            recommendations.append(
                "Irrigation is recommended for better productivity."
            )

        return recommendations