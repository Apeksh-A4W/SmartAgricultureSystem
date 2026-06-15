from services.market_service import MarketPriceService
prices = MarketPriceService.get_prices()
print(f'Total crops: {len(prices.get("prices", []))}')
print(f'Source: {prices.get("source")}')
print(f'Last update: {prices.get("lastUpdate")}')
if prices.get('prices'):
    print(f'First crop: {prices["prices"][0]["crop"]} - ₹{prices["prices"][0]["price"]}')
    print(f'Has realistic price data: {prices["prices"][0]["price"] > 0}')
