import requests
import os
import json
from datetime import datetime, timedelta
from django.core.cache import cache


API_KEY = os.getenv("DATA_GOV_API_KEY")


def _safe_float(value, fallback=0.0):
    try:
        return float(value or fallback)
    except (TypeError, ValueError):
        return fallback


def _normalize_crop_name(name):
    return str(name or "").strip()  # env key for data.gov.in


class MarketPriceService:
    """Market price service with caching, fallback data, and trend calculation."""

    BASE_URL = (
        "https://api.data.gov.in/resource/"
        "9ef84268-d588-465a-a308-a864a43d0070"
    )

    # Comprehensive list of crops across India
    COMPREHENSIVE_CROPS = [
        "rice", "wheat", "maize", "cotton", "sugarcane",
        "barley", "millets", "soybean", "groundnut", "mustard",
        "sunflower", "tomato", "potato", "onion", "chilli",
        "banana", "mango", "apple", "grapes", "coffee",
        "tea", "tobacco", "jute", "coconut", "cashew"
    ]

    # Default realistic fallback prices (based on typical Indian market rates)
    FALLBACK_PRICES = {
        "rice": {"price": 2100, "change": 2.4, "trend": [1800, 1850, 1920, 2000, 2050, 2080, 2100]},
        "wheat": {"price": 1900, "change": 1.1, "trend": [1750, 1800, 1850, 1875, 1900, 1900, 1900]},
        "maize": {"price": 1750, "change": -0.8, "trend": [1820, 1810, 1800, 1780, 1765, 1755, 1750]},
        "cotton": {"price": 6200, "change": 3.5, "trend": [5500, 5700, 5900, 6000, 6100, 6150, 6200]},
        "sugarcane": {"price": 280, "change": 0.5, "trend": [270, 272, 275, 277, 279, 280, 280]},
        "barley": {"price": 1650, "change": -1.2, "trend": [1750, 1720, 1700, 1680, 1670, 1660, 1650]},
        "millets": {"price": 2450, "change": 1.8, "trend": [2200, 2280, 2350, 2400, 2430, 2450, 2450]},
        "soybean": {"price": 4500, "change": 2.1, "trend": [4100, 4200, 4300, 4400, 4450, 4480, 4500]},
        "groundnut": {"price": 5200, "change": 1.5, "trend": [4800, 4900, 5000, 5050, 5100, 5150, 5200]},
        "mustard": {"price": 5800, "change": 0.3, "trend": [5600, 5650, 5700, 5750, 5800, 5800, 5800]},
        "sunflower": {"price": 4800, "change": 2.5, "trend": [4200, 4400, 4500, 4600, 4700, 4750, 4800]},
        "tomato": {"price": 1200, "change": 5.2, "trend": [900, 950, 1000, 1050, 1100, 1150, 1200]},
        "potato": {"price": 850, "change": 1.8, "trend": [700, 750, 780, 800, 820, 835, 850]},
        "onion": {"price": 950, "change": -2.1, "trend": [1150, 1100, 1050, 1000, 970, 960, 950]},
        "chilli": {"price": 8500, "change": 3.2, "trend": [7500, 7800, 8000, 8200, 8300, 8400, 8500]},
        "banana": {"price": 1100, "change": 1.9, "trend": [950, 1000, 1030, 1060, 1080, 1090, 1100]},
        "mango": {"price": 2800, "change": 2.8, "trend": [2300, 2450, 2600, 2700, 2750, 2780, 2800]},
        "apple": {"price": 3200, "change": 0.8, "trend": [3000, 3050, 3100, 3150, 3180, 3200, 3200]},
        "grapes": {"price": 3500, "change": 1.4, "trend": [3200, 3250, 3300, 3350, 3400, 3450, 3500]},
        "coffee": {"price": 9500, "change": 1.1, "trend": [9000, 9100, 9250, 9350, 9450, 9475, 9500]},
        "tea": {"price": 250, "change": 0.4, "trend": [240, 242, 245, 247, 248, 249, 250]},
    }

    @staticmethod
    def get_cached_prices():
        """Get prices from cache if available."""
        return cache.get("market_prices_cache")

    @staticmethod
    def set_cached_prices(prices_data, source):
        """Cache prices with timestamp and source."""
        cache_data = {
            "prices": prices_data,
            "source": source,
            "lastUpdate": datetime.now().isoformat(),
            "totalCrops": len(prices_data)
        }
        cache.set("market_prices_cache", cache_data, timeout=3600)  # Cache for 1 hour
        return cache_data

    @staticmethod
    def calculate_7day_average(crop_key):
        """Calculate 7-day average price from fallback data."""
        if crop_key in MarketPriceService.FALLBACK_PRICES:
            trend = MarketPriceService.FALLBACK_PRICES[crop_key].get("trend", [])
            return sum(trend) / len(trend) if trend else 0
        return 0

    @staticmethod
    def get_prices(crop=None):
        """Get market prices with fallback to cached/estimated data."""
        
        # Try cache first
        cached = MarketPriceService.get_cached_prices()
        if cached:
            if crop:
                filtered = [p for p in cached["prices"] if p["crop"].lower() == crop.lower()]
                return {
                    "prices": filtered,
                    "source": "cached",
                    "lastUpdate": cached.get("lastUpdate"),
                    "totalCrops": len(cached["prices"])
                }
            return cached

        # Try live API
        try:
            params = {
                "api-key": API_KEY,
                "format": "json",
                "limit": 50
            }

            if crop:
                params["filters[commodity]"] = crop

            response = requests.get(
                MarketPriceService.BASE_URL,
                params=params,
                timeout=10
            )
            response.raise_for_status()
            data = response.json()

            unique_prices = {}
            records = data.get("records", []) or data.get("results", []) or []

            for item in records:
                crop_name = item.get("commodity", item.get("name", "Unknown"))
                price = float(item.get("modal_price") or item.get("price") or 0 or 0)
                change = float(item.get("price_change", 0) or 0)
                if price > 0:
                    crop_key = crop_name.lower()

                    fallback = MarketPriceService.FALLBACK_PRICES.get(crop_key, {})

                    unique_prices[crop_key] = {
                        "crop": crop_name,
                        "price": price,
                        "change": change,
                        "trend": fallback.get("trend", [])
                    }
                
            prices = list(unique_prices.values())
            if prices:
                return MarketPriceService.set_cached_prices(prices, "live_api")

        except Exception as e:
            print(f"Live API failed: {str(e)}")

        # Fallback to estimated data from comprehensive crops list
        prices = []
        for crop_key in MarketPriceService.COMPREHENSIVE_CROPS:
            if crop and crop.lower() != crop_key.lower():
                continue
            
            crop_name = crop_key.capitalize()
            fallback_data = MarketPriceService.FALLBACK_PRICES.get(crop_key, {})
            
            prices.append({
                "crop": crop_name,
                "price": fallback_data.get("price", 0),
                "change": fallback_data.get("change", 0),
                "trend": fallback_data.get("trend", []),
            })

        return MarketPriceService.set_cached_prices(prices, "estimated")