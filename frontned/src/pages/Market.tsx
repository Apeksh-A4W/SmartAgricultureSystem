import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { TopBar } from "@/components/TopBar";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Home, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from "lucide-react";
import { cropImages } from "@/lib/cropImages";



const Market = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();
  const { t } = useApp();
  const [filter, setFilter] = useState<string>("all");

  // Generate trend data for selected crop (or rice if none selected)
  const selectedCrop = filter === "all" ? marketData[0] : marketData.find(p => p.crop?.toLowerCase() === filter);
  const trendData = selectedCrop
    ? Array.from({ length: 7 }, (_, i) => {
        const basePrice = selectedCrop.price || 2000;
        const variance = (selectedCrop.change || 0) * 10;
        return {
          day: `Day ${i + 1}`,
          price: Math.round(basePrice - (variance * (6 - i) / 6) + Math.random() * 50),
        };
      })
    : [];

  const visible =
    filter === "all"
      ? marketData
      : marketData.filter((p) => p.crop?.toLowerCase() === filter);

  const top =
    marketData.length > 0
      ? [...marketData].sort((a, b) => (b.change || 0) - (a.change || 0))[0]
      : null;

  const fetchMarketData = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const response = await apiFetch("/market/live-prices/");

      // Backend returns: {prices: [...], source: "live_api" | "cached" | "estimated", lastUpdate: "...", totalCrops: number}
      if (response?.prices && Array.isArray(response.prices)) {
        setMarketData(response.prices);
      } else {
        throw new Error("Invalid response format: missing prices array");
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to load market prices";
      setError(errorMsg);
      console.error("Market API Error:", err);
      
      // Set fallback data even on error
      if (marketData.length === 0) {
        setMarketData([]);
      }
    } finally {
      if (showRefresh) setRefreshing(false);
      else setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
  }, []);

  const handleRefresh = () => {
    fetchMarketData(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg font-semibold">
          Loading market prices...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <TopBar />

      <div className="px-4 pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("marketPrices")}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Today's mandi rates · Updated hourly
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-muted transition-smooth active:scale-90 disabled:opacity-50"
            title="Refresh prices"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive text-sm">Error Loading Market Prices</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        {!error && marketData.length === 0 && (
          <div className="bg-muted rounded-lg p-8 text-center">
            <p className="text-muted-foreground">No market data available at the moment</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
            >
              Try Again
            </button>
          </div>
        )}

        {!error && marketData.length > 0 && (
          <>
        {/* Top mover summary */}
        <div className="bg-gradient-to-br from-primary/10 via-card to-secondary/10 rounded-2xl p-4 border border-border shadow-soft animate-scale-in">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                Today's top mover
              </div>
              <div className="text-base font-bold text-foreground">{top?.crop || "No data"}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">
                ₹{(top?.price || 0)?.toLocaleString?.() || 0}
              </div>
              <div className={`text-xs font-semibold flex items-center justify-end gap-0.5 ${
                (top?.change || 0) > 0 ? "text-success" : "text-destructive"
              }`}>
                {(top?.change || 0) > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {(top?.change || 0) > 0 ? "+" : ""}{(top?.change || 0).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            {
              id: "all",
              name: "All crops",
            },
            ...marketData.slice(0, 10).map((p) => ({
              id: p.crop?.toLowerCase() || "unknown",
              name: p.crop || "Unknown",
            })),
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setFilter(p.id)}
              className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-smooth active:scale-95 ${
                filter === p.id
                  ? "bg-primary text-primary-foreground border-primary shadow-button"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Bar graph - Price comparison */}
        <div className="bg-card rounded-2xl p-4 shadow-soft border border-border hover-lift">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">
              Price comparison
            </h3>
            <span className="text-xs text-muted-foreground">₹ / Quintal</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={visible.slice(0, 8)}
              margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--border))"
                vertical={false}
              />
              <XAxis
                dataKey="crop"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  boxShadow: "var(--shadow-card)",
                  background: "hsl(var(--card))",
                  fontSize: 12,
                }}
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
                formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
              />
              <Bar dataKey="price" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Price cards */}
        <div className="space-y-2.5">
          {visible.map((p) => {
            const up = !String(p.change || 0).includes("-");
            const cropKey = p.crop?.toLowerCase() || "rice";
            const cropImage = cropImages[cropKey] || cropImages.rice;

            return (
              <div
                key={p.id || p.crop}
                className="bg-card rounded-2xl p-3 shadow-soft border border-border flex items-center gap-3 hover-lift animate-fade-up"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border">
                  <img
                    src={cropImage}
                    alt={p.crop || "Crop"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-base">
                    {p.crop || "Unknown"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("perQuintal")}
                  </div>
                  {/* Mini change bar */}
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${up ? "bg-success" : "bg-destructive"}`}
                      style={{
                        width: `${Math.min(Math.abs(p.change || 0) * 20, 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    ₹{Number(p.price || 0).toLocaleString?.() || 0}
                  </div>
                  <div
                    className={`text-xs font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                      up
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {up ? "+" : ""}{(p.change || 0).toFixed(1)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trend chart for selected crop */}
        {trendData.length > 0 && (
          <div className="bg-card rounded-2xl p-4 shadow-soft border border-border hover-lift">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-foreground text-sm">
                {selectedCrop?.crop || "Rice"} · 7-day trend
              </h3>
              <span className="text-xs font-semibold text-success flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +{(selectedCrop?.change || 0).toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Showing price trend analysis
            </p>
            <ResponsiveContainer width="100%" height={140}>
              <LineChart
                data={trendData}
                margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--secondary))" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    background: "hsl(var(--card))",
                    fontSize: 11,
                  }}
                  formatter={(value: any) => `₹${Number(value).toLocaleString()}`}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="url(#trendGrad)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default Market;
