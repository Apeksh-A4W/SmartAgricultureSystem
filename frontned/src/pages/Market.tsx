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
import { Home, TrendingUp, TrendingDown } from "lucide-react";
import { cropImages } from "@/lib/cropImages";

const prices = [
  { id: "rice", name: "Rice", price: 2100, change: 2.4 },
  { id: "wheat", name: "Wheat", price: 1900, change: 1.1 },
  { id: "maize", name: "Maize", price: 1750, change: -0.8 },
  { id: "cotton", name: "Cotton", price: 6200, change: 3.5 },
];


const trend = [
  { m: "Jan", p: 1850 },
  { m: "Feb", p: 1900 },
  { m: "Mar", p: 1950 },
  { m: "Apr", p: 2000 },
  { m: "May", p: 2080 },
  { m: "Jun", p: 2100 },
];

const Market = () => {
  const [marketData, setMarketData] =
  useState<any[]>([]);

const [loading, setLoading] =
  useState(true);
  const navigate = useNavigate();
  const { t } = useApp();
  const [filter, setFilter] = useState<string>("all");

const visible =
  filter === "all"
    ? marketData
    : marketData.filter(
        (p) =>
          p.crop?.toLowerCase() ===
          filter
      ); const top =
  [...marketData].sort((a, b) => b.change - a.change)[0];
useEffect(() => {

  const fetchMarketData = async () => {

    try {

      setLoading(true);

      const response =
        await apiFetch(
          "/market/live-prices/"
        );

      if (response.prices) {

        setMarketData(
          response.prices
        );

      } else if (
        response.data?.records
      ) {

        const cleaned =
          response.data.records.map(
            (item: any) => ({

              crop:
                item.commodity,

              price:
                item.modal_price,

              change:
                "+0%"
            })
          );

        setMarketData(cleaned);
      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  };

  fetchMarketData();

}, []);
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
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("marketPrices")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Today's mandi rates · Updated hourly
          </p>
        </div>

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
              <div className="text-base font-bold text-foreground">{top.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">
                ₹{top.price.toLocaleString()}
              </div>
              <div className="text-xs font-semibold text-success flex items-center justify-end gap-0.5">
                <TrendingUp className="w-3 h-3" /> +{top.change}%
              </div>
            </div>
          </div>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {[
  {
    id: "all",
    name: "All crops"
  },

  ...marketData.map((p) => ({

    id:
      p.crop?.toLowerCase(),

    name:
      p.crop
  }))
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
              {p.crop}
            </button>
          ))}
        </div>

        {/* Bar graph */}
        <div className="bg-card rounded-2xl p-4 shadow-soft border border-border hover-lift">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">
              Price comparison
            </h3>
            <span className="text-xs text-muted-foreground">₹ / Quintal</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
data={marketData}              margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
            >
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
dataKey="crop"                axisLine={false}
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
              />
              <Bar dataKey="price" fill="url(#barGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Price cards */}
        <div className="space-y-2.5">
          {visible.map((p) => {
            const up =
  !String(p.change)
    .includes("-");
            return (
              <div
                key={p.id}
                className="bg-card rounded-2xl p-3 shadow-soft border border-border flex items-center gap-3 hover-lift animate-fade-up"
              >
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted flex-shrink-0 ring-1 ring-border">
                  <img
                   src={
  cropImages[
    p.crop?.toLowerCase()
  ]
}
                    alt={p.crop}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-base">
                    {p.crop}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {t("perQuintal")}
                  </div>
                  {/* Mini change bar */}
                  <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${up ? "bg-success" : "bg-destructive"}`}
                      style={{ width: `${Math.min(Math.abs(p.change) * 20, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-foreground">
                    ₹{
  Number(
    p.price
  ).toLocaleString()
}
                  </div>
                  <div
                    className={`text-xs font-bold inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                      up ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {up ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {up ? "+" : ""}
                    {p.change}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mini trend */}
        <div className="bg-card rounded-2xl p-4 shadow-soft border border-border hover-lift">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-foreground text-sm">
              Rice · 6 month trend
            </h3>
            <span className="text-xs font-semibold text-success flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> +13.5%
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Steady upward movement
          </p>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart
              data={trend}
              margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="m"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
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
                  boxShadow: "var(--shadow-card)",
                  background: "hsl(var(--card))",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="p"
                stroke="hsl(var(--primary))"
                strokeWidth={2.8}
                dot={{ fill: "hsl(var(--primary))", r: 4, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full h-13 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground text-base font-semibold shadow-button transition-smooth active:scale-[0.98] hover:opacity-95 flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" /> {t("finish")}
        </button>
      </div>
    </div>
  );
};

export default Market;
