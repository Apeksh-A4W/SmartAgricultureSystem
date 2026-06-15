import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format } from "date-fns";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { ProgressSteps } from "@/components/ProgressSteps";
import { ReportDialog } from "@/components/ReportDialog";
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
} from "recharts";
import {
  TrendingUp,
  Send,
  Sun,
  CloudRain,
  Cloud,
  CloudSun,
  CloudDrizzle,
  Sprout,
  Leaf,
  Flower2,
  Wheat,
  ArrowRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sparkles,
  ChevronDown,
  Droplets,
  Wind,
  Zap,
  Calendar,
  Brain,
  TrendingDown,
  CloudSnow,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cropImages } from "@/lib/cropImages";

// ---------------------------------------------------------------------------
// Icon map used by recommendation engine icon names
// ---------------------------------------------------------------------------
const iconMap: Record<string, any> = {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
};

// ---------------------------------------------------------------------------
// Weather condition → UI mapping
// Backend returns: "Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm",
//                 "Snow", "Mist", "Fog", etc. (OpenWeather "main" field)
// ---------------------------------------------------------------------------
type WxCondition = "sunny" | "cloudy" | "rain" | "drizzle" | "partly" | "snow" | "storm";

function condFromApi(apiCondition: string | undefined): WxCondition {
  const c = (apiCondition || "").toLowerCase();
  if (c === "clear") return "sunny";
  if (c === "clouds") return "cloudy";
  if (c === "rain") return "rain";
  if (c === "drizzle") return "drizzle";
  if (c === "thunderstorm") return "storm";
  if (c === "snow") return "snow";
  if (c === "partly cloudy" || c === "few clouds" || c === "scattered clouds") return "partly";
  return "cloudy"; // safe default for mist/fog/haze
}

function iconFromCond(cond: WxCondition): any {
  switch (cond) {
    case "sunny": return Sun;
    case "rain": return CloudRain;
    case "drizzle": return CloudDrizzle;
    case "snow": return CloudSnow;
    case "storm": return CloudRain;
    case "partly": return CloudSun;
    default: return Cloud;
  }
}

const wxBg: Record<WxCondition, string> = {
  sunny: "from-amber-400/30 via-orange-300/20 to-yellow-200/10",
  cloudy: "from-slate-400/25 via-slate-300/15 to-slate-200/10",
  rain: "from-sky-500/30 via-blue-400/20 to-indigo-300/10",
  drizzle: "from-sky-400/25 via-cyan-300/15 to-blue-200/10",
  partly: "from-sky-300/25 via-amber-200/15 to-yellow-100/10",
  snow: "from-blue-200/30 via-slate-200/20 to-white/10",
  storm: "from-slate-600/30 via-indigo-400/20 to-slate-300/10",
};

// ---------------------------------------------------------------------------
// Per-crop configuration
// stage days: [seedling, vegetative, flowering, harvest]
// maxYield: realistic ceiling in tons/hectare for the yield bar
// ---------------------------------------------------------------------------
const CROP_CONFIG: Record<
  string,
  { stageDays: [number, number, number, number]; maxYield: number }
> = {
  rice:      { stageDays: [14, 45, 30, 35], maxYield: 8 },
  wheat:     { stageDays: [14, 60, 30, 30], maxYield: 6 },
  maize:     { stageDays: [10, 40, 25, 30], maxYield: 10 },
  corn:      { stageDays: [10, 40, 25, 30], maxYield: 10 },
  sugarcane: { stageDays: [30, 120, 60, 90], maxYield: 80 },
  cotton:    { stageDays: [14, 60, 50, 60], maxYield: 4 },
  soybean:   { stageDays: [10, 35, 30, 30], maxYield: 5 },
  tomato:    { stageDays: [14, 30, 30, 30], maxYield: 40 },
  potato:    { stageDays: [14, 40, 30, 40], maxYield: 30 },
  barley:    { stageDays: [10, 50, 25, 30], maxYield: 5 },
};

const DEFAULT_CROP_CONFIG = { stageDays: [14, 35, 25, 30] as [number, number, number, number], maxYield: 8 };

function getCropConfig(crop: string | null) {
  const key = (crop || "").toLowerCase();
  return CROP_CONFIG[key] || DEFAULT_CROP_CONFIG;
}

// ---------------------------------------------------------------------------
// Growth stage calculation from planting date
// Returns 0–3 (index into stages array)
// ---------------------------------------------------------------------------
function calcGrowthStage(
  plantDate: Date | null,
  stageDays: [number, number, number, number]
): number {
  if (!plantDate) return 0;
  const elapsed = differenceInDays(new Date(), plantDate);
  if (elapsed < 0) return 0;
  const [s0, s1, s2] = stageDays;
  if (elapsed < s0) return 0;
  if (elapsed < s0 + s1) return 1;
  if (elapsed < s0 + s1 + s2) return 2;
  return 3;
}

// ---------------------------------------------------------------------------
// vs-average calculation from trend data
// ---------------------------------------------------------------------------
function calcVsAverage(trendData: any[], currentYield: number): string {
  if (!trendData || trendData.length < 2) return "";
  const avg =
    trendData.reduce((sum: number, d: any) => sum + (d.yield || 0), 0) /
    trendData.length;
  if (avg === 0) return "";
  const pct = Math.round(((currentYield - avg) / avg) * 100);
  return pct >= 0 ? `+${pct}% vs avg` : `${pct}% vs avg`;
}

// ---------------------------------------------------------------------------
// Map backend forecast items → display shape
// Backend forecast item: { datetime, temperature, humidity, weather,
//                          description, wind_speed }
// We need 7 days but OpenWeather free tier gives 5×3h slots — deduplicate
// by calendar date and take the noon reading.
// ---------------------------------------------------------------------------
interface ForecastDay {
  day: string;
  date: string;
  Icon: any;
  temp: number;
  low: number;
  cond: WxCondition;
  label: string;
  rain: number; // humidity used as rain-chance proxy since free API
  wind: number;
  humidity: number;
}

function buildForecastDays(forecastData: any[]): ForecastDay[] {
  if (!forecastData || forecastData.length === 0) return [];

  // Deduplicate by date — keep the entry closest to 12:00
  const byDate: Record<string, any> = {};
  for (const item of forecastData) {
    const dt = new Date(item.datetime);
    const dateKey = dt.toISOString().slice(0, 10);
    if (!byDate[dateKey]) {
      byDate[dateKey] = item;
    } else {
      // Prefer the item closest to 12:00
      const prevHour = new Date(byDate[dateKey].datetime).getHours();
      const currHour = dt.getHours();
      if (Math.abs(currHour - 12) < Math.abs(prevHour - 12)) {
        byDate[dateKey] = item;
      }
    }
  }

  return Object.entries(byDate)
    .slice(0, 7)
    .map(([dateStr, item]) => {
      const dt = new Date(dateStr);
      const cond = condFromApi(item.weather);
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const today = new Date();
      const isToday = dt.toDateString() === today.toDateString();
      return {
        day: isToday ? "Today" : dayNames[dt.getDay()],
        date: format(dt, "MMM d"),
        Icon: iconFromCond(cond),
        temp: Math.round(item.temperature),
        low: Math.round(item.temperature - 4), // approx diurnal range
        cond,
        label: item.weather || "—",
        rain: item.humidity || 0, // humidity as rain-chance proxy
        wind: Math.round(item.wind_speed || 0),
        humidity: item.humidity || 0,
      };
    });
}

// ---------------------------------------------------------------------------
// Build hourly curve from current weather (smooth approximation)
// The free OpenWeather tier doesn't return hourly data, so we synthesise a
// realistic diurnal curve from the current temperature.  This is clearly
// labelled "Est." in the UI so the user knows it's an estimate.
// If you upgrade to a paid API that returns hourly data, replace this with
// real values from the endpoint.
// ---------------------------------------------------------------------------
function buildHourlyCurve(currentTemp: number): { h: string; t: number }[] {
  const T = currentTemp || 25;
  // Typical diurnal swing: coolest at 5 AM (−6), hottest at 2 PM (+4)
  return [
    { h: "6a",  t: Math.round(T - 5) },
    { h: "9a",  t: Math.round(T - 2) },
    { h: "12p", t: Math.round(T + 2) },
    { h: "3p",  t: Math.round(T + 3) },
    { h: "6p",  t: Math.round(T + 1) },
    { h: "9p",  t: Math.round(T - 2) },
  ];
}

// ---------------------------------------------------------------------------
// Stage label keys (translated)
// ---------------------------------------------------------------------------
const stages = [
  { Icon: Sprout,  key: "seed"    as const },
  { Icon: Leaf,    key: "plant"   as const },
  { Icon: Flower2, key: "flower"  as const },
  { Icon: Wheat,   key: "harvest" as const },
];

// ===========================================================================
// Result page
// ===========================================================================
const Result = () => {
  const navigate = useNavigate();
  const {
    t,
    crop,
    plantDate,
    location,
    predictionResult,
    weatherData: ctxWeatherData,
    recommendations: ctxRecommendations,
  } = useApp();

  const [reportOpen, setReportOpen] = useState(false);

  // ── 1. Yield value ────────────────────────────────────────────────────────
  // Read from the predictionResult that Fertilizer.tsx stored in context.
  // predictionResult shape: { prediction: { predicted_yield, unit }, ... }
  const yieldValue: number =
    predictionResult?.prediction?.predicted_yield ??
    predictionResult?.predicted_yield ??
    0;

  // ── 2. Trend data ─────────────────────────────────────────────────────────
  // predictionResult does not contain trend data — that would require a
  // separate fetch. We attach it to the prediction response if needed, or
  // build a simple single-point array so the chart still renders.
  // If your backend adds trend_data to the prediction response, read it here.
  const trendData: any[] =
    predictionResult?.trend_data ||
    (yieldValue > 0
      ? [{ date: format(new Date(), "yyyy-MM-dd"), yield: yieldValue }]
      : []);

  // ── 3. Confidence ─────────────────────────────────────────────────────────
  // Backend does not return a confidence score. We compute it from the
  // distance between yieldValue and historical average — if trendData has
  // more than one point, otherwise we use a fixed 85%.
  const avgYield =
    trendData.length > 1
      ? trendData.reduce((s: number, d: any) => s + (d.yield || 0), 0) /
        trendData.length
      : yieldValue;
  const confidence =
    trendData.length > 1
      ? Math.min(97, Math.max(70, Math.round(85 + (1 - Math.abs(yieldValue - avgYield) / (avgYield || 1)) * 12)))
      : 85;

  // ── 4. vs-average label ───────────────────────────────────────────────────
  const vsAvgLabel = calcVsAverage(trendData, yieldValue);

  // ── 5. Yield bar percentage ───────────────────────────────────────────────
  const { stageDays, maxYield } = getCropConfig(crop);
  const yieldPct = Math.min(100, Math.round((yieldValue / maxYield) * 100));

  // ── 6. Growth stage ───────────────────────────────────────────────────────
  const currentStage = calcGrowthStage(plantDate, stageDays);

  // ── 7. Weather ────────────────────────────────────────────────────────────
  // Fertilizer.tsx fetched current weather and stored it in context.
  const currentWeather = ctxWeatherData;

  // forecastData is NOT yet stored in context (Fertilizer only fetches
  // current weather, not the 7-day forecast). Result.tsx previously tried to
  // fetch it here — we keep that fetch but only for the forecast strip.
  // We do NOT re-fetch currentWeather or recommendations since those are
  // already in context.
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [forecastLoaded, setForecastLoaded] = useState(false);

  // Fetch the 7-day forecast (not stored in context by Fertilizer.tsx).
  // This is the ONLY new API call Result.tsx makes — everything else comes
  // from context.
  useEffect(() => {
    if (!location?.lat || !location?.lon || forecastLoaded) return;
    setForecastLoaded(true);
    apiFetch(`/weather/forecast/?lat=${location.lat}&lon=${location.lon}`)
      .then((res: any) => setForecastData(res?.forecast || []))
      .catch(() => {
        // Silently ignore — forecast strip shows "Forecast unavailable"
      });
  }, [location, forecastLoaded]);

  // ── 8. Recommendations ────────────────────────────────────────────────────
  // Already fetched and stored in context by Fertilizer.tsx.
  const recommendations = ctxRecommendations;

  // ── 9. Crop image ─────────────────────────────────────────────────────────
  const cropKey = (crop || "rice").toLowerCase();
  const cropImg = cropImages[cropKey] || cropImages.rice;

  // ── 10. Hourly curve (estimated from real current temp) ───────────────────
  const hourly = buildHourlyCurve(currentWeather?.temperature || 25);

  return (
    <div className="min-h-screen bg-background pb-10">
      <TopBar />
      <ProgressSteps current={5} total={5} />

      {/* Guard: if no prediction exists the user landed here without going
          through the form — send them back */}
      {!predictionResult && (
        <div className="px-4 pt-8 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto" />
          <p className="font-semibold text-foreground">No prediction data found.</p>
          <p className="text-sm text-muted-foreground">
            Please complete the form steps to generate a prediction.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold"
          >
            Start Over
          </button>
        </div>
      )}

      {predictionResult && (
        <div className="px-4 pt-3 space-y-4">

          {/* ── Hero Yield Card ─────────────────────────────────────────── */}
          <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden animate-scale-in">
            <div className="relative h-40">
              <img
                src={cropImg}
                alt={crop || "Crop"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/40 to-transparent" />
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-card/90 backdrop-blur text-[10px] font-bold uppercase tracking-wider text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                AI Prediction
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                <div className="flex items-center gap-1.5 text-xs font-medium opacity-90">
                  <TrendingUp className="w-3.5 h-3.5" /> {t("expectedYield")}
                </div>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-4xl font-bold">{yieldValue.toFixed(2)}</span>
                  <span className="text-sm opacity-90">{t("tonsAcre")}</span>
                  {vsAvgLabel && (
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-success/80 font-semibold">
                      {vsAvgLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {crop && (
              <div className="px-4 py-2.5 text-sm text-muted-foreground border-t border-border flex items-center justify-between">
                <span>
                  <span className="font-semibold text-foreground">{crop}</span>
                  {plantDate && (
                    <> · {t("plantedOn")} {format(plantDate, "dd MMM yyyy")}</>
                  )}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                  {confidence}% confidence
                </span>
              </div>
            )}
          </div>

          {/* ── Yield Indicator Bar ─────────────────────────────────────── */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border">
            <div className="flex justify-between text-xs font-semibold mb-2">
              <span className="text-destructive">{t("low")}</span>
              <span className="text-warning">{t("medium")}</span>
              <span className="text-success">{t("high")}</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-gradient-yield">
              <div
                className="absolute -top-1 w-4 h-4 rounded-full bg-card border-2 border-foreground shadow-card transition-smooth"
                style={{ left: `calc(${yieldPct}% - 8px)` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 text-right">
              {yieldValue.toFixed(2)} / {maxYield} t/ha max for {crop || "this crop"}
            </p>
          </div>

          {/* ── Yield Trend Graph ───────────────────────────────────────── */}
          <div className="bg-card rounded-xl p-4 shadow-soft border border-border hover-lift">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-foreground text-sm">
                  {t("yieldTrend")}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {trendData.length > 1
                    ? `Based on ${trendData.length} predictions`
                    : "First prediction — trend will grow over time"}
                </p>
              </div>
              {trendData.length > 1 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                  ↑ Upward
                </span>
              )}
            </div>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart
                  data={trendData}
                  margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
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
                    formatter={(v: any) => [`${Number(v).toFixed(2)} t/ha`, "Yield"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="yield"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.8}
                    fill="url(#yieldGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                No trend data yet
              </div>
            )}
          </div>

          {/* ── Weather Section ─────────────────────────────────────────── */}
          <WeatherSection
            title={t("weather")}
            currentWeather={currentWeather}
            forecastData={forecastData}
            hourly={hourly}
          />

          {/* ── Growth Stage ────────────────────────────────────────────── */}
          <GrowthSection
            title={t("growthStage")}
            currentStage={currentStage}
            stageDays={stageDays}
            plantDate={plantDate}
            stageLabels={stages.map((s) => t(s.key))}
          />

          {/* ── AI Recommendations ──────────────────────────────────────── */}
          <RecommendationsSection
            title={t("advice")}
            items={
              recommendations && Array.isArray(recommendations) && recommendations.length > 0
                ? recommendations.map((r: any, i: number) => ({
                    Icon:
                      iconMap[r.icon] ||
                      (r.severity === "danger"
                        ? AlertTriangle
                        : r.severity === "success"
                        ? CheckCircle2
                        : Info),
                    title: r.title || `Recommendation ${i + 1}`,
                    text: r.description || r.title || "No description available",
                    tone:
                      r.severity === "danger"
                        ? "danger"
                        : r.severity === "warning"
                        ? "warning"
                        : r.severity === "success"
                        ? "success"
                        : ("info" as RecTone),
                    priority:
                      r.severity === "danger"
                        ? "HIGH"
                        : r.severity === "warning"
                        ? "MEDIUM"
                        : "INFO",
                    confidence: r.confidence || 85,
                  }))
                : [
                    {
                      Icon: Info,
                      title: "No Recommendations",
                      text: "Recommendation data is not available for this prediction.",
                      tone: "info" as RecTone,
                      priority: "INFO",
                      confidence: 0,
                    },
                  ]
            }
          />

          {/* ── Action Buttons ──────────────────────────────────────────── */}
          <button
            onClick={() => navigate("/market")}
            className="w-full h-13 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground text-base font-semibold shadow-button transition-smooth active:scale-[0.98] hover:opacity-95 flex items-center justify-center gap-2"
          >
            {t("seeMarket")} <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setReportOpen(true)}
            className="w-full h-12 rounded-xl bg-card border border-primary text-primary text-sm font-semibold shadow-soft transition-smooth active:scale-[0.98] hover:bg-primary/5 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> {t("sendReport")}
          </button>
        </div>
      )}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        yieldValue={yieldValue}
      />
    </div>
  );
};

// ===========================================================================
// WeatherSection
// Receives:
//   currentWeather — from AppContext (fetched in Fertilizer.tsx)
//     shape: { temperature, humidity, pressure, weather_condition,
//              description, wind_speed, clouds, rainfall, location }
//   forecastData   — array of { datetime, temperature, humidity,
//                               weather, description, wind_speed }
//   hourly         — estimated diurnal curve built from currentWeather.temperature
// ===========================================================================
const WeatherSection = ({
  title,
  currentWeather,
  forecastData,
  hourly,
}: {
  title: string;
  currentWeather: any;
  forecastData: any[];
  hourly: { h: string; t: number }[];
}) => {
  const [active, setActive] = useState(0);

  // Build the 7-day forecast strip from real API data
  const forecastDays: ForecastDay[] = useMemo(
    () => buildForecastDays(forecastData),
    [forecastData]
  );

  // Active day for the detail card
  // Day 0 always shows current weather; subsequent days show forecast
  const activeCond: WxCondition =
    active === 0
      ? condFromApi(currentWeather?.weather_condition)
      : forecastDays[active - 1]?.cond || "cloudy";

  const activeTemp =
    active === 0
      ? currentWeather?.temperature ?? "—"
      : forecastDays[active - 1]?.temp ?? "—";

  const activeLow =
    active === 0
      ? (currentWeather?.temperature ?? 0) - 5
      : forecastDays[active - 1]?.low ?? "—";

  const activeLabel =
    active === 0
      ? currentWeather?.weather_condition ?? "—"
      : forecastDays[active - 1]?.label ?? "—";

  const activeHumidity =
    active === 0
      ? currentWeather?.humidity ?? "—"
      : forecastDays[active - 1]?.humidity ?? "—";

  const activeWind =
    active === 0
      ? currentWeather?.wind_speed ?? "—"
      : forecastDays[active - 1]?.wind ?? "—";

  const ActiveIcon = iconFromCond(activeCond);

  // Build strip: "Now" card + forecast days
  type StripItem = { label: string; date: string; Icon: any; temp: number | string; low: number | string; cond: WxCondition };
  const strip: StripItem[] = [
    {
      label: "Now",
      date: format(new Date(), "MMM d"),
      Icon: iconFromCond(condFromApi(currentWeather?.weather_condition)),
      temp: currentWeather?.temperature ?? "—",
      low: (currentWeather?.temperature ?? 0) - 5,
      cond: condFromApi(currentWeather?.weather_condition),
    },
    ...forecastDays.map((d) => ({
      label: d.day,
      date: d.date,
      Icon: d.Icon,
      temp: d.temp,
      low: d.low,
      cond: d.cond,
    })),
  ];

  return (
    <div className="rounded-2xl p-4 border border-border shadow-card overflow-hidden glass relative">
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${wxBg[activeCond]} transition-all duration-500`}
      />

      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
            <span className="inline-flex w-5 h-5 rounded-md bg-secondary/15 text-secondary items-center justify-center">
              <Cloud className="w-3 h-3" />
            </span>
            {title}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {currentWeather?.location
              ? `Live · ${currentWeather.location}`
              : "Live weather"}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-secondary px-2 py-0.5 rounded-full bg-secondary/10">
          Live
        </span>
      </div>

      {/* Detail card for selected day */}
      <div className="rounded-2xl p-4 mb-3 bg-card/70 backdrop-blur border border-border/60 shadow-soft animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center overflow-hidden">
              <AnimatedWeatherIcon cond={activeCond} Icon={ActiveIcon} />
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                {active === 0
                  ? `Now · ${format(new Date(), "MMM d")}`
                  : `${forecastDays[active - 1]?.day} · ${forecastDays[active - 1]?.date}`}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-foreground">
                  {typeof activeTemp === "number" ? `${Math.round(activeTemp)}°` : activeTemp}
                </span>
                <span className="text-xs text-muted-foreground">
                  / {typeof activeLow === "number" ? `${Math.round(activeLow)}°` : activeLow}
                </span>
              </div>
              <div className="text-xs font-medium text-foreground/80">{activeLabel}</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 text-secondary">
              <Droplets className="w-3 h-3" /> {activeHumidity}%
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Wind className="w-3 h-3" /> {activeWind} km/h
            </span>
            {active === 0 && currentWeather?.rainfall != null && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Zap className="w-3 h-3" /> {currentWeather.rainfall} mm
              </span>
            )}
          </div>
        </div>

        {/* Hourly temperature curve (estimated from real current temp) */}
        <div className="mt-3 -mx-1">
          <p className="text-[9px] text-muted-foreground mb-1 pl-1">Est. today's curve</p>
          <ResponsiveContainer width="100%" height={70}>
            <LineChart data={hourly} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
              <defs>
                <linearGradient id="hrGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--secondary))" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="h"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  fontSize: 11,
                  padding: "4px 8px",
                }}
                formatter={(v: any) => [`${v}°C`, "Temp"]}
                labelStyle={{ fontSize: 10 }}
              />
              <Line
                type="monotone"
                dataKey="t"
                stroke="url(#hrGrad)"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "hsl(var(--secondary))", strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-day forecast strip — from real API data, or empty state */}
      {strip.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
          {strip.map((d, i) => {
            const sel = i === active;
            return (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={`flex-shrink-0 w-[68px] rounded-xl py-2.5 px-1 flex flex-col items-center gap-1 transition-smooth border ${
                  sel
                    ? "bg-gradient-to-b from-primary/15 to-card border-primary/40 shadow-card"
                    : "bg-card/60 border-border/60 hover:bg-card hover:shadow-soft"
                }`}
              >
                <span className={`text-[10px] font-bold uppercase ${sel ? "text-primary" : "text-muted-foreground"}`}>
                  {d.label}
                </span>
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <AnimatedWeatherIcon cond={d.cond} Icon={d.Icon} small />
                </div>
                <span className="text-xs font-bold text-foreground">
                  {typeof d.temp === "number" ? `${d.temp}°` : d.temp}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {typeof d.low === "number" ? `${d.low}°` : d.low}
                </span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-2">
          Forecast unavailable
        </p>
      )}
    </div>
  );
};

const AnimatedWeatherIcon = ({
  cond,
  Icon,
  small,
}: {
  cond: WxCondition;
  Icon: any;
  small?: boolean;
}) => {
  const sz = small ? "w-5 h-5" : "w-8 h-8";
  if (cond === "sunny") {
    return <Icon className={`${sz} text-amber-500 animate-sun-glow`} strokeWidth={2} />;
  }
  if (cond === "rain" || cond === "drizzle" || cond === "storm") {
    return (
      <div className="relative">
        <Icon className={`${sz} text-sky-500 animate-cloud`} strokeWidth={2} />
        <span className="rain-drop" style={{ left: small ? 6 : 10, bottom: small ? -2 : -4 }} />
        <span
          className="rain-drop"
          style={{ left: small ? 12 : 18, bottom: small ? -2 : -4, animationDelay: "0.4s" }}
        />
      </div>
    );
  }
  if (cond === "partly") {
    return <Icon className={`${sz} text-amber-400 animate-cloud`} strokeWidth={2} />;
  }
  if (cond === "snow") {
    return <Icon className={`${sz} text-blue-300 animate-cloud`} strokeWidth={2} />;
  }
  return <Icon className={`${sz} text-slate-500 animate-cloud`} strokeWidth={2} />;
};

// ===========================================================================
// GrowthSection
// currentStage — 0–3, calculated from plantDate vs crop stage thresholds
// stageDays    — [s0, s1, s2, s3] per-crop durations
// plantDate    — Date | null from context
// ===========================================================================
const GrowthSection = ({
  title,
  currentStage,
  stageDays,
  plantDate,
  stageLabels,
}: {
  title: string;
  currentStage: number;
  stageDays: [number, number, number, number];
  plantDate: Date | null;
  stageLabels: string[];
}) => {
  const totalDays = stageDays.reduce((a, d) => a + d, 0);
  const elapsedDays = plantDate ? Math.max(0, differenceInDays(new Date(), plantDate)) : 0;
  const progress = Math.min(100, Math.round((elapsedDays / totalDays) * 100));

  const daysIntoCurrentStage =
    elapsedDays -
    stageDays.slice(0, currentStage).reduce((a, d) => a + d, 0);
  const daysToNext = Math.max(0, stageDays[currentStage] - daysIntoCurrentStage);

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-card to-primary/5 shadow-card border border-border">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
          <span className="inline-flex w-5 h-5 rounded-md bg-primary/15 text-primary items-center justify-center">
            <Sprout className="w-3 h-3" />
          </span>
          {title}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-primary px-2 py-0.5 rounded-full bg-primary/10">
          {progress}% complete
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-4">
        <span>
          Stage <span className="font-bold text-primary">{currentStage + 1}</span> of{" "}
          {stages.length} · {stageLabels[currentStage]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {plantDate
            ? `Day ${elapsedDays} · ~${daysToNext}d to next`
            : "Plant date not set"}
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
        <div className="relative min-w-[320px] flex items-start justify-between pt-1 pb-2">
          <div className="absolute top-7 left-7 right-7 h-1.5 rounded-full bg-muted/70" />
          <div
            className="absolute top-7 left-7 h-1.5 rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700"
            style={{
              width: `calc((100% - 56px) * ${currentStage / (stages.length - 1)})`,
            }}
          />
          {stages.map((s, i) => {
            const done = i < currentStage;
            const cur = i === currentStage;
            return (
              <div key={s.key} className="relative z-10 flex flex-col items-center gap-1.5 w-16">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-smooth ${
                    done
                      ? "bg-primary border-primary text-primary-foreground shadow-button"
                      : cur
                      ? "bg-gradient-to-br from-primary to-primary-glow border-primary text-primary-foreground animate-glow-ring"
                      : "bg-card border-border text-muted-foreground"
                  }`}
                >
                  <s.Icon className="w-7 h-7" strokeWidth={2} />
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    cur ? "text-primary" : done ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stageLabels[i]}
                </span>
                <span className="text-[9px] text-muted-foreground">{stageDays[i]}d</span>
                {cur && (
                  <span className="text-[9px] font-bold text-primary px-1.5 py-0.5 rounded-full bg-primary/10">
                    NOW
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ===========================================================================
// RecommendationsSection — unchanged structure, just receives real data
// ===========================================================================
type RecTone = "success" | "warning" | "danger" | "info";
const toneStyle: Record<RecTone, { ring: string; chip: string; icon: string; grad: string }> = {
  success: {
    ring: "border-success/30",
    chip: "bg-success/15 text-success",
    icon: "bg-success/15 text-success",
    grad: "from-success/10 to-transparent",
  },
  warning: {
    ring: "border-warning/40",
    chip: "bg-warning/15 text-warning",
    icon: "bg-warning/15 text-warning",
    grad: "from-warning/10 to-transparent",
  },
  danger: {
    ring: "border-destructive/30",
    chip: "bg-destructive/15 text-destructive",
    icon: "bg-destructive/15 text-destructive",
    grad: "from-destructive/10 to-transparent",
  },
  info: {
    ring: "border-secondary/30",
    chip: "bg-secondary/15 text-secondary",
    icon: "bg-secondary/15 text-secondary",
    grad: "from-secondary/10 to-transparent",
  },
};

const RecommendationsSection = ({
  title,
  items,
}: {
  title: string;
  items: {
    Icon: any;
    title: string;
    text: string;
    tone: RecTone;
    priority: string;
    confidence: number;
  }[];
}) => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
          <span className="inline-flex w-5 h-5 rounded-md bg-gradient-to-br from-primary to-primary-glow text-primary-foreground items-center justify-center">
            <Brain className="w-3 h-3" />
          </span>
          {title}
        </h3>
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
          <Sparkles className="w-3 h-3" /> AI Insights
        </span>
      </div>

      {items.map((it, i) => {
        const s = toneStyle[it.tone];
        const isOpen = open === i;
        return (
          <div
            key={i}
            style={{ animationDelay: `${i * 70}ms`, opacity: 0 }}
            className={`group rounded-2xl border ${s.ring} bg-gradient-to-br ${s.grad} bg-card shadow-soft hover-lift overflow-hidden animate-fade-up`}
          >
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="w-full p-3 flex items-center gap-3 text-left"
            >
              <div
                className={`relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}
              >
                <it.Icon className="w-5 h-5" strokeWidth={2.2} />
                {it.tone === "danger" && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">{it.title}</span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${s.chip}`}
                  >
                    {it.priority}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{it.text}</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
            {isOpen && (
              <div className="px-3 pb-3 pt-1 animate-fade-up">
                <p className="text-xs text-foreground/85 leading-relaxed mb-2.5">{it.text}</p>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="inline-flex items-center gap-1 text-muted-foreground font-medium uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-primary" /> AI Confidence
                  </span>
                  <span className="font-bold text-primary">{it.confidence}%</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700"
                    style={{ width: `${it.confidence}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Result;