def generate_recommendations(

    predicted_yield,
    temperature,
    humidity,
    weather_condition
):

    recommendations = []

    if predicted_yield < 3:

        recommendations.append(
            "Low predicted yield detected."
        )

        recommendations.append(
            "Increase soil nutrition monitoring."
        )

    if temperature > 35:

        recommendations.append(
            "High temperature risk detected."
        )

        recommendations.append(
            "Increase irrigation frequency."
        )

    if humidity > 80:

        recommendations.append(
            "High humidity may increase disease risk."
        )

    if weather_condition.lower() == 'rain':

        recommendations.append(
            "Heavy rainfall precautions advised."
        )

    if len(recommendations) == 0:

        recommendations.append(
            "Crop conditions appear stable."
        )

    return recommendations