def generate_recommendations(
    nitrogen=0,
    phosphorus=0,
    potassium=0,
    temperature=25,
    humidity=60,
    rainfall=100,
    predicted_yield=2.5,
    weather_condition="Sunny",
    crop_type="rice",
    soil_type="loamy",
    irrigation_used=1
):
    """
    Generate professional farming recommendations based on soil nutrients,
    weather, and crop conditions.
    
    Returns a list of recommendation objects with:
    - title: recommendation title
    - description: detailed description
    - severity: danger, warning, info, success
    - confidence: 0-100 confidence percentage
    - actionable_steps: list of specific actions
    - related_factor: what triggered this recommendation
    - category: nutrient, weather, irrigation, pest, yield
    - icon: icon name from lucide-react
    """
    
    recommendations = []
    weather_lower =( weather_condition.lower() if weather_condition else "sunny")
    
    # ===== NITROGEN RECOMMENDATIONS =====
    if nitrogen < 20:
        recommendations.append({
            "title": "Low Nitrogen Level",
            "description": "Nitrogen levels are below optimal range (< 20). This may limit plant growth and vegetative development.",
            "severity": "danger",
            "confidence": 95,
            "actionable_steps": [
                "Apply urea (46% nitrogen) at 20-30 kg/hectare",
                "Consider organic sources: compost or farmyard manure",
                "Apply nitrogen in 2-3 splits during growing season",
                "Monitor leaves for yellowing (nitrogen deficiency symptom)"
            ],
            "related_factor": f"Current N: {nitrogen} mg/kg",
            "category": "nutrient",
            "icon": "AlertTriangle"
        })
    elif nitrogen < 40:
        recommendations.append({
            "title": "Moderate Nitrogen Deficiency",
            "description": "Nitrogen levels are in the low-moderate range. While not critical, slight boost recommended.",
            "severity": "warning",
            "confidence": 85,
            "actionable_steps": [
                "Side-dress with nitrogen fertilizer (10-15 kg/hectare)",
                "Apply liquid nitrogen fertilizer for quick uptake",
                "Ensure adequate water for nitrogen absorption"
            ],
            "related_factor": f"Current N: {nitrogen} mg/kg",
            "category": "nutrient",
            "icon": "AlertCircle"
        })
    elif nitrogen > 100:
        recommendations.append({
            "title": "Excess Nitrogen",
            "description": "High nitrogen levels may cause excessive vegetative growth, delaying flowering and reducing yield.",
            "severity": "warning",
            "confidence": 80,
            "actionable_steps": [
                "Hold off on nitrogen fertilizer applications",
                "Increase potassium to balance nutrient uptake",
                "Monitor for pest susceptibility (excess N increases pest attacks)",
                "Ensure adequate drainage to reduce nitrogen retention"
            ],
            "related_factor": f"Current N: {nitrogen} mg/kg",
            "category": "nutrient",
            "icon": "AlertTriangle"
        })
    else:
        recommendations.append({
            "title": "Nitrogen Level Optimal",
            "description": "Nitrogen level is in the optimal range for healthy plant growth.",
            "severity": "success",
            "confidence": 90,
            "actionable_steps": [
                "Maintain current nitrogen management practices",
                "Continue monitoring soil nitrogen levels",
                "Apply light nitrogen doses if yield trends down"
            ],
            "related_factor": f"Current N: {nitrogen} mg/kg",
            "category": "nutrient",
            "icon": "CheckCircle2"
        })
    
    # ===== PHOSPHORUS RECOMMENDATIONS =====
    if phosphorus < 10:
        recommendations.append({
            "title": "Critical Phosphorus Deficiency",
            "description": "Phosphorus is critically low (< 10). Plants will show stunted growth and purple discoloration.",
            "severity": "danger",
            "confidence": 92,
            "actionable_steps": [
                "Immediately apply phosphate fertilizer (DAP or SSP) at 40-60 kg/hectare",
                "Use biofertilizers to enhance phosphorus availability",
                "Acidify soil if pH > 7.5 to improve phosphorus uptake",
                "Monitor plant color - purple tinge indicates P deficiency"
            ],
            "related_factor": f"Current P: {phosphorus} mg/kg",
            "category": "nutrient",
            "icon": "AlertTriangle"
        })
    elif phosphorus < 20:
        recommendations.append({
            "title": "Low Phosphorus Level",
            "description": "Phosphorus deficiency detected. May affect root development and flowering.",
            "severity": "warning",
            "confidence": 88,
            "actionable_steps": [
                "Apply 20-30 kg/hectare phosphate fertilizer",
                "Use rock phosphate for sustained release",
                "Increase mycorrhizal fungi activity through compost"
            ],
            "related_factor": f"Current P: {phosphorus} mg/kg",
            "category": "nutrient",
            "icon": "AlertCircle"
        })
    else:
        recommendations.append({
            "title": "Phosphorus Level Adequate",
            "description": "Phosphorus levels are sufficient for normal growth and reproduction.",
            "severity": "success",
            "confidence": 88,
            "actionable_steps": [
                "Maintain current phosphorus application schedule",
                "Continue soil monitoring every 2-3 months"
            ],
            "related_factor": f"Current P: {phosphorus} mg/kg",
            "category": "nutrient",
            "icon": "CheckCircle2"
        })
    
    # ===== POTASSIUM RECOMMENDATIONS =====
    if potassium < 20:
        recommendations.append({
            "title": "Low Potassium Level",
            "description": "Potassium deficiency detected. Important for disease resistance and fruit quality.",
            "severity": "danger",
            "confidence": 90,
            "actionable_steps": [
                "Apply potassium chloride or potassium sulfate at 30-40 kg/hectare",
                "Use muriate of potash (MOP) for quick effect",
                "Split applications in growing season (2-3 times)",
                "Watch for leaf scorch (K deficiency symptom)"
            ],
            "related_factor": f"Current K: {potassium} mg/kg",
            "category": "nutrient",
            "icon": "AlertTriangle"
        })
    else:
        recommendations.append({
            "title": "Potassium Level Adequate",
            "description": "Potassium is in good range for plant health and disease resistance.",
            "severity": "success",
            "confidence": 85,
            "actionable_steps": [
                "Maintain current management practices",
                "Monitor for signs of K deficiency (leaf edge burning)"
            ],
            "related_factor": f"Current K: {potassium} mg/kg",
            "category": "nutrient",
            "icon": "CheckCircle2"
        })
    
    # ===== TEMPERATURE RECOMMENDATIONS =====
    if temperature > 38:
        recommendations.append({
            "title": "Extreme Heat Stress Alert",
            "description": "Very high temperature detected. Risk of heat stress, pollen sterility, and reduced yield.",
            "severity": "danger",
            "confidence": 95,
            "actionable_steps": [
                "Increase irrigation frequency (every 3-4 days)",
                "Mulch around plants to retain soil moisture",
                "Avoid fertilizer application during peak heat",
                "Consider anti-transpirants or shade cloth for sensitive crops"
            ],
            "related_factor": f"Current Temp: {temperature}°C",
            "category": "weather",
            "icon": "AlertTriangle"
        })
    elif temperature > 32:
        recommendations.append({
            "title": "High Temperature Warning",
            "description": "Temperature is elevated. Monitor for heat stress symptoms.",
            "severity": "warning",
            "confidence": 85,
            "actionable_steps": [
                "Increase irrigation to 1.5-2x normal frequency",
                "Ensure soil moisture is adequate",
                "Light mulching to keep soil cool",
                "Spray water on foliage during hottest hours (early morning)"
            ],
            "related_factor": f"Current Temp: {temperature}°C",
            "category": "weather",
            "icon": "AlertCircle"
        })
    elif temperature < 10:
        recommendations.append({
            "title": "Low Temperature Alert",
            "description": "Temperature is below optimal range. May slow growth and metabolism.",
            "severity": "info",
            "confidence": 75,
            "actionable_steps": [
                "Delay fertilizer applications until temperature rises",
                "Reduce irrigation frequency",
                "Wait for warmer days before critical operations",
                "Apply frost protection if temperature drops below 5°C"
            ],
            "related_factor": f"Current Temp: {temperature}°C",
            "category": "weather",
            "icon": "Info"
        })
    else:
        recommendations.append({
            "title": "Temperature Optimal",
            "description": "Temperature is in the ideal range for crop growth.",
            "severity": "success",
            "confidence": 90,
            "actionable_steps": [
                "Maintain current irrigation and management practices",
                "Ideal window for fertilizer application"
            ],
            "related_factor": f"Current Temp: {temperature}°C",
            "category": "weather",
            "icon": "CheckCircle2"
        })
    
    # ===== HUMIDITY RECOMMENDATIONS =====
    if humidity > 85:
        recommendations.append({
            "title": "High Humidity - Disease Risk",
            "description": "High humidity increases fungal and bacterial disease risk. Monitor for symptoms.",
            "severity": "warning",
            "confidence": 88,
            "actionable_steps": [
                "Improve air circulation by pruning lower branches",
                "Avoid overhead watering - use drip irrigation",
                "Apply fungicide preventatively if disease prone",
                "Space plants adequately for air flow",
                "Reduce irrigation frequency"
            ],
            "related_factor": f"Current Humidity: {humidity}%",
            "category": "weather",
            "icon": "AlertCircle"
        })
    elif humidity < 30:
        recommendations.append({
            "title": "Low Humidity Alert",
            "description": "Very low humidity increases water loss and heat stress risk.",
            "severity": "info",
            "confidence": 80,
            "actionable_steps": [
                "Increase irrigation frequency",
                "Apply mulch to reduce evaporation",
                "Consider misting or humid storage for sensitive crops",
                "Monitor for drought stress symptoms"
            ],
            "related_factor": f"Current Humidity: {humidity}%",
            "category": "weather",
            "icon": "AlertCircle"
        })
    else:
        recommendations.append({
            "title": "Humidity Level Good",
            "description": "Humidity is in the comfortable range (30-85%).",
            "severity": "success",
            "confidence": 85,
            "actionable_steps": [
                "Continue regular monitoring",
                "Disease pressure is moderate - standard disease management sufficient"
            ],
            "related_factor": f"Current Humidity: {humidity}%",
            "category": "weather",
            "icon": "CheckCircle2"
        })
    
    # ===== RAINFALL RECOMMENDATIONS =====
    # ===== WEATHER + RAINFALL COMBINED ANALYSIS =====

    is_rain_expected = (
        "rain" in weather_lower
        or "drizzle" in weather_lower
        or humidity > 85
    )

    if is_rain_expected:

        recommendations.append({
            "title": "Rainfall Expected",
            "description": "Wet weather conditions detected. Focus on disease prevention and drainage management.",
            "severity": "warning",
            "confidence": 90,
            "actionable_steps": [
                "Ensure proper field drainage",
                "Avoid excess irrigation",
                "Monitor fungal diseases",
                "Avoid applying water-soluble fertilizers before rain",
                "Inspect roots for waterlogging symptoms"
            ],
            "related_factor": f"Weather: {weather_condition}",
            "category": "weather",
            "icon": "AlertCircle"
        })

        if rainfall > 150:
            recommendations.append({
                "title": "Waterlogging Risk",
                "description": "Heavy rainfall may cause root damage and nutrient leaching.",
                "severity": "warning",
                "confidence": 92,
                "actionable_steps": [
                    "Open drainage channels",
                    "Monitor root health",
                    "Delay fertilizer applications",
                    "Inspect low-lying field areas"
                ],
                "related_factor": f"Rainfall: {rainfall} mm",
                "category": "weather",
                "icon": "AlertTriangle"
            })

    else:

        if rainfall < 60:

            recommendations.append({
                "title": "Low Rainfall - Drought Risk",
                "description": "Insufficient rainfall detected. Irrigation support recommended.",
                "severity": "warning",
                "confidence": 90,
                "actionable_steps": [
                    "Increase irrigation frequency",
                    "Apply mulch",
                    "Monitor soil moisture",
                    "Avoid water stress during flowering"
                ],
                "related_factor": f"Rainfall: {rainfall} mm",
                "category": "irrigation",
                "icon": "AlertTriangle"
            })

        elif rainfall > 150:

            recommendations.append({
                "title": "Heavy Rainfall Alert",
                "description": "Excess rainfall may reduce oxygen availability in root zone.",
                "severity": "warning",
                "confidence": 85,
                "actionable_steps": [
                    "Improve drainage",
                    "Inspect root health",
                    "Delay fertilizer applications"
                ],
                "related_factor": f"Rainfall: {rainfall} mm",
                "category": "weather",
                "icon": "AlertTriangle"
            })

        else:

            recommendations.append({
                "title": "Rainfall Normal",
                "description": "Rainfall levels are currently suitable.",
                "severity": "success",
                "confidence": 85,
                "actionable_steps": [
                    "Continue current irrigation schedule"
                ],
                "related_factor": f"Rainfall: {rainfall} mm",
                "category": "weather",
                "icon": "CheckCircle2"
            })
    
    # ===== YIELD PREDICTION RECOMMENDATIONS =====
    if predicted_yield < 2:
        recommendations.append({
            "title": "Low Yield Prediction Alert",
            "description": "AI prediction indicates low yield potential. Intervention recommended.",
            "severity": "danger",
            "confidence": 85,
            "actionable_steps": [
                "Review fertilizer application schedule",
                "Ensure irrigation is adequate",
                "Scout for pest/disease issues",
                "Adjust crop variety selection for next season",
                "Consider supplementary micronutrients (Zn, Fe, B)"
            ],
            "related_factor": f"Predicted Yield: {predicted_yield} tons/acre",
            "category": "yield",
            "icon": "TrendingDown"
        })
    elif predicted_yield > 3:
        recommendations.append({
            "title": "High Yield Potential",
            "description": "Excellent yield prediction! Maintain current management practices.",
            "severity": "success",
            "confidence": 90,
            "actionable_steps": [
                "Continue with current crop management",
                "Maintain disease and pest monitoring",
                "Prepare for harvest timing",
                "Ensure storage facilities ready"
            ],
            "related_factor": f"Predicted Yield: {predicted_yield} tons/acre",
            "category": "yield",
            "icon": "TrendingUp"
        })
    else:
        recommendations.append({
            "title": "Moderate Yield Expected",
            "description": "Yield prediction is moderate. Optimization opportunities exist.",
            "severity": "info",
            "confidence": 82,
            "actionable_steps": [
                "Fine-tune irrigation schedule",
                "Apply balanced fertilizer ratios",
                "Monitor for early pest/disease signs",
                "Consider micronutrient supplementation"
            ],
            "related_factor": f"Predicted Yield: {predicted_yield} tons/acre",
            "category": "yield",
            "icon": "Info"
        })
    
    # ===== WEATHER CONDITION SPECIFIC RECOMMENDATIONS =====
    
    
   
    
    # Ensure we always have at least 3 recommendations
    
    
    return recommendations