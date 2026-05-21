import { useState } from "react";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
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
} from "lucide-react";
import { cropImages } from "@/lib/cropImages";


// Icon map for recommendation engine icon names
const iconMap: Record<string, any> = {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  TrendingDown,
};



type WxCondition = "sunny" | "cloudy" | "rain" | "drizzle" | "partly";

const weather: {
  day: string;
  date: string;
  Icon: any;
  temp: number;
  low: number;
  cond: WxCondition;
  label: string;
  rain: number;
  wind: number;
  humidity: number;
}[] = [
  { day: "Today", date: "May 9", Icon: Sun, temp: 28, low: 19, cond: "sunny", label: "Sunny", rain: 0, wind: 8, humidity: 42 },
  { day: "Tue", date: "May 10", Icon: CloudRain, temp: 24, low: 18, cond: "rain", label: "Rain", rain: 80, wind: 14, humidity: 78 },
  { day: "Wed", date: "May 11", Icon: CloudDrizzle, temp: 23, low: 17, cond: "drizzle", label: "Drizzle", rain: 55, wind: 11, humidity: 70 },
  { day: "Thu", date: "May 12", Icon: Cloud, temp: 26, low: 19, cond: "cloudy", label: "Cloudy", rain: 20, wind: 9, humidity: 60 },
  { day: "Fri", date: "May 13", Icon: CloudSun, temp: 29, low: 20, cond: "partly", label: "Partly Sunny", rain: 10, wind: 7, humidity: 48 },
  { day: "Sat", date: "May 14", Icon: Sun, temp: 31, low: 22, cond: "sunny", label: "Sunny", rain: 0, wind: 6, humidity: 40 },
  { day: "Sun", date: "May 15", Icon: CloudSun, temp: 30, low: 21, cond: "partly", label: "Partly Sunny", rain: 5, wind: 8, humidity: 45 },
];

const hourly = [
  { h: "6a", t: 19 },
  { h: "9a", t: 23 },
  { h: "12p", t: 27 },
  { h: "3p", t: 28 },
  { h: "6p", t: 25 },
  { h: "9p", t: 22 },
];

const wxBg: Record<WxCondition, string> = {
  sunny: "from-amber-400/30 via-orange-300/20 to-yellow-200/10",
  cloudy: "from-slate-400/25 via-slate-300/15 to-slate-200/10",
  rain: "from-sky-500/30 via-blue-400/20 to-indigo-300/10",
  drizzle: "from-sky-400/25 via-cyan-300/15 to-blue-200/10",
  partly: "from-sky-300/25 via-amber-200/15 to-yellow-100/10",
};

const stages = [
  { Icon: Sprout, key: "seed" as const, days: 14 },
  { Icon: Leaf, key: "plant" as const, days: 28 },
  { Icon: Flower2, key: "flower" as const, days: 21 },
  { Icon: Wheat, key: "harvest" as const, days: 35 },
];

const Result = () => {
  const navigate = useNavigate();
const {
  t,
  crop,
  plantDate,
  location,
  npk
} = useApp();  const [reportOpen, setReportOpen] = useState(false);
  const [currentWeather, setCurrentWeather] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [yieldValue, setYieldValue] = useState(0); 
const confidence =
  yieldValue > 3
    ? 96
    : yieldValue > 2
    ? 90
    : yieldValue > 1
    ? 82
    : 70;
const yieldPct = (yieldValue / 4) * 100;
const [recommendations, setRecommendations] =
  useState<string[]>([]);
  const currentStage =
  yieldValue < 1
    ? 0
    : yieldValue < 2
    ? 1
    : yieldValue < 3
    ? 2
    : 3;
  const cropKey = crop?.toLowerCase() || "rice";
  const cropImg = cropImages[cropKey] || cropImages.rice;
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        let latest = null;
        let weatherData = null;

        // Fetch prediction history
        const predictionData = await apiFetch("/predictions/history/");

        if (predictionData?.results && predictionData.results.length > 0) {
          latest = predictionData.results[0];
          setYieldValue(latest?.predicted_yield || 0);
        }

        // Fetch yield trends
        const trendResponse = await apiFetch("/predictions/yield-trends/");
        setTrendData(trendResponse?.trend_data || []);

        // Fetch weather data
        if (location?.lat && location?.lon) {
          weatherData = await apiFetch(
            `/weather/current/?lat=${location.lat}&lon=${location.lon}`
          );
          setCurrentWeather(weatherData || null);

          const forecast = await apiFetch(
            `/weather/forecast/?lat=${location.lat}&lon=${location.lon}`
          );
          setForecastData(forecast?.forecast || []);
        }

        // Fetch recommendations
        if (npk) {
          const advice = await apiFetch("/recommendations/farming-advice/", {
            method: "POST",
            body: JSON.stringify({
              nitrogen: npk.nitrogen || 0,
              phosphorus: npk.phosphorus || 0,
              potassium: npk.potassium || 0,
              temperature: weatherData?.temperature || 25,
              humidity: weatherData?.humidity || 60,
              rainfall: weatherData?.rainfall || 100,
              weather: weatherData?.weather_condition || "Sunny",
              prediction: latest?.predicted_yield || 0,
              crop_type: crop || "rice",
              soil_type: "loamy",
              irrigation_used: 1,
            }),
          });

          // Handle both array and object responses
          const recs = Array.isArray(advice) ? advice : (advice?.recommendations || []);
          setRecommendations(recs);
        }
      } catch (err: any) {
        const errorMsg = err.message || "Failed to load prediction data";
        setError(errorMsg);
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location, npk]);


  return (
    <div className="min-h-screen bg-background pb-10">
      <TopBar />
      <ProgressSteps current={5} total={5} />

      {loading && (
        <div className="px-4 pt-8 text-center">
          <div className="animate-pulse text-lg font-semibold">
            Loading prediction data...
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 pt-4">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive text-sm">Error Loading Data</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
      <div className="px-4 pt-3 space-y-4">
        {/* Hero Yield Card with crop image */}
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
                <span className="text-4xl font-bold animate-count-up">{yieldValue}</span>
                <span className="text-sm opacity-90">{t("tonsAcre")}</span>
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-success/80 font-semibold">
                  +12% vs avg
                </span>
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

        {/* Yield indicator bar */}
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
        </div>

        {/* Trend graph */}
        <div className="bg-card rounded-xl p-4 shadow-soft border border-border hover-lift">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground text-sm">
                {t("yieldTrend")}
              </h3>
              <p className="text-xs text-muted-foreground">Projected growth curve</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
              ↑ Upward
            </span>
          </div>
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
            <XAxis dataKey="date" />
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
        </div>

        {/* Weather — premium dashboard */}
<WeatherSection
  title={t("weather")}
  currentWeather={currentWeather}
  forecastData={forecastData}
/>
        {/* Growth Stage — premium timeline */}
        <GrowthSection
          title={t("growthStage")}
          currentStage={currentStage}
          stageLabels={stages.map((s) => t(s.key))}
        />

        {/* AI Recommendations */}
        <RecommendationsSection
          title={t("advice")}
          items={
            (recommendations && Array.isArray(recommendations))
              ? recommendations.map((r: any, i: number) => ({
                  Icon: iconMap[r.icon] || (r.severity === "danger" ? AlertTriangle : r.severity === "success" ? CheckCircle2 : Info),
                  title: r.title || `Recommendation ${i + 1}`,
                  text: r.description || r.title || "No description available",
                  tone: r.severity === "danger" ? "danger" : r.severity === "warning" ? "warning" : r.severity === "success" ? "success" : "info",
                  priority: r.severity === "danger" ? "HIGH" : r.severity === "warning" ? "MEDIUM" : "INFO",
                  confidence: r.confidence || 85,
                }))
              : [
                  {
                    Icon: Info,
                    title: "No Recommendations",
                    text: "Could not load recommendations",
                    tone: "info" as const,
                    priority: "INFO",
                    confidence: 0,
                  },
                ]
          }
        />

        {/* Buttons */}
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
        </>
      )}

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        yieldValue={yieldValue}
      />
    </div>
  );
};

/* ---------- Weather Section ---------- */
const WeatherSection = ({
  title,
  currentWeather,
  forecastData
}: any) => {  const [active, setActive] = useState(0);
  const forecastWeather = currentWeather
    ? {
        temp: currentWeather.temperature,
        low: currentWeather.temperature - 5,
        label: currentWeather.weather_condition,
        wind: currentWeather.wind_speed,
        humidity: currentWeather.humidity,
      }
    : null;

  const w =
    forecastData && forecastData.length > 0
      ? forecastData[active] || weather[active]
      : weather[active] || weather[0];

  return (
    <div className="rounded-2xl p-4 border border-border shadow-card overflow-hidden glass relative">
      <div
        className={`absolute inset-0 -z-10 bg-gradient-to-br ${wxBg[w?.cond || "sunny"]} transition-all duration-500`}
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
            {currentWeather ? "Live data" : "7-day outlook"}
          </p>
        </div>
        <span className="text-[10px] uppercase tracking-wider font-bold text-secondary px-2 py-0.5 rounded-full bg-secondary/10">
          {currentWeather ? "Live" : "Forecast"}
        </span>
      </div>

      <div className="rounded-2xl p-4 mb-3 bg-card/70 backdrop-blur border border-border/60 shadow-soft animate-scale-in">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-secondary/20 to-primary/10 flex items-center justify-center overflow-hidden">
              <AnimatedWeatherIcon
                cond={currentWeather?.weather_condition?.toLowerCase().includes("rain") ? "rain" : "sunny"}
                Icon={w?.Icon || Sun}
              />
            </div>
            <div>
              <div className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                {currentWeather ? "Now" : w?.day || "Today"} · {currentWeather ? new Date().toLocaleDateString() : w?.date || "Today"}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-foreground">
                  {forecastWeather?.temp || currentWeather?.temperature || 28}°
                </span>
                <span className="text-xs text-muted-foreground">
                  / {forecastWeather?.low || currentWeather?.temperature - 5 || 19}°
                </span>
              </div>
              <div className="text-xs font-medium text-foreground/80">
                {forecastWeather?.label || currentWeather?.weather_condition || "Sunny"}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1 text-secondary">
              <Droplets className="w-3 h-3" /> {w?.rain || currentWeather?.humidity || 0}%
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Wind className="w-3 h-3" /> {forecastWeather?.wind || currentWeather?.wind_speed || 8} km/h
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Zap className="w-3 h-3" /> {forecastWeather?.humidity || currentWeather?.humidity || 40}%
            </span>
          </div>
        </div>

        <div className="mt-3 -mx-1">
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

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {weather.map((d, i) => {
          const sel = i === active;
          return (
            <button
              key={d.date}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-[68px] rounded-xl py-2.5 px-1 flex flex-col items-center gap-1 transition-smooth border ${
                sel
                  ? "bg-gradient-to-b from-primary/15 to-card border-primary/40 shadow-card"
                  : "bg-card/60 border-border/60 hover:bg-card hover:shadow-soft"
              }`}
            >
              <span className={`text-[10px] font-bold uppercase ${sel ? "text-primary" : "text-muted-foreground"}`}>
                {d.day}
              </span>
              <div className="relative w-8 h-8 flex items-center justify-center">
                <AnimatedWeatherIcon cond={d.cond} Icon={d.Icon} small />
              </div>
              <span className="text-xs font-bold text-foreground">{d.temp}°</span>
              <span className="text-[9px] text-muted-foreground">{d.low}°</span>
            </button>
          );
        })}
      </div>
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
  if (cond === "rain" || cond === "drizzle") {
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
  return <Icon className={`${sz} text-slate-500 animate-cloud`} strokeWidth={2} />;
};

/* ---------- Growth Section ---------- */
const GrowthSection = ({
  title,
  currentStage,
  stageLabels,
}: {
  title: string;
  currentStage: number;
  stageLabels: string[];
}) => {
  const totalDays = stages.reduce((a, s) => a + s.days, 0);
  const elapsed = stages.slice(0, currentStage).reduce((a, s) => a + s.days, 0) + 8;
  const progress = Math.round((elapsed / totalDays) * 100);
  const daysToNext = stages[currentStage].days - 8;

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
          Stage <span className="font-bold text-primary">{currentStage + 1}</span> of {stages.length} · {stageLabels[currentStage]}
        </span>
        <span className="inline-flex items-center gap-1">
          <Calendar className="w-3 h-3" /> ~{daysToNext}d to next
        </span>
      </div>

      <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
        <div className="relative min-w-[320px] flex items-start justify-between pt-1 pb-2">
          <div className="absolute top-7 left-7 right-7 h-1.5 rounded-full bg-muted/70" />
          <div
            className="absolute top-7 left-7 h-1.5 rounded-full bg-gradient-to-r from-primary to-primary-glow transition-all duration-700"
            style={{ width: `calc((100% - 56px) * ${currentStage / (stages.length - 1)})` }}
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
                <span className="text-[9px] text-muted-foreground">{s.days}d</span>
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

/* ---------- Recommendations Section ---------- */
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
              <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.icon}`}>
                <it.Icon className="w-5 h-5" strokeWidth={2.2} />
                {it.tone === "danger" && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">{it.title}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${s.chip}`}>
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
