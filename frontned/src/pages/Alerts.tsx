import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { apiFetch } from "@/lib/api";
import { distanceKm, timeAgo } from "@/lib/geo";
import {
  Bug,
  PawPrint,
  Leaf,
  CloudLightning,
  Plus,
  MapPin,
  Loader2,
  Filter,
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

const NEARBY_RADIUS_KM = 10;

interface Alert {
  id: string;
 alert_type: "PEST" | "ANIMAL" | "DISEASE" | "WEATHER";

severity: "DANGER" | "WARNING" | "SAFE";
  description: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

const typeMeta = {

  PEST: {
    Icon: Bug,
    key: "pest" as const,
    color: "destructive"
  },

  ANIMAL: {
    Icon: PawPrint,
    key: "animal" as const,
    color: "warning"
  },

  DISEASE: {
    Icon: Leaf,
    key: "disease" as const,
    color: "accent"
  },

  WEATHER: {
    Icon: CloudLightning,
    key: "weatherDamage" as const,
    color: "secondary"
  },
};

const severityMeta = {

  DANGER: {
    color: "destructive",
    labelKey: "danger" as const,
    Icon: ShieldAlert
  },

  WARNING: {
    color: "warning",
    labelKey: "warning" as const,
    Icon: AlertTriangle
  },

  SAFE: {
    color: "success",
    labelKey: "safe" as const,
    Icon: ShieldCheck
  },
};

type FilterKey =
  | "all"
  | "PEST"
  | "ANIMAL"
  | "DISEASE"
  | "WEATHER";
const Alerts = () => {
  const navigate = useNavigate();
  const { t, location } = useApp();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKey>("all");
const [sevFilter, setSevFilter] = useState<
  "all" |
  "DANGER" |
  "WARNING" |
  "SAFE"
>("all");
 useEffect(() => {

  const fetchAlerts = async () => {

    try {

      setLoading(true);

      if (!location) return;

      const data = await apiFetch(

        `/alerts/nearby/?latitude=${location.lat}&longitude=${location.lon}`
      );

      setAlerts(data.alerts || []);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  };

  fetchAlerts();

}, [location]);

  const enriched = useMemo(() => {
    const list = location
      ? alerts
          .map((a) => ({
            ...a,
            distance: distanceKm(location.lat, location.lon, a.latitude, a.longitude),
          }))
          .filter((a) => a.distance <= NEARBY_RADIUS_KM)
          .sort((a, b) => a.distance - b.distance)
      : alerts.map((a) => ({ ...a, distance: 0 }));
    return list
      .filter((a) => filter === "all" || a.alert_type === filter)
      .filter((a) => sevFilter === "all" || a.severity === sevFilter);
  }, [alerts, location, filter, sevFilter]);

  const counts = useMemo(() => ({
    total: alerts.length,
    danger: alerts.filter((a) => a.severity === "DANGER").length,
    warning: alerts.filter((a) => a.severity === "WARNING").length,
    safe: alerts.filter((a) => a.severity === "SAFE").length,
  }), [alerts]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar showAlertsLink={false} />

      <div className="max-w-xl mx-auto px-4 pt-3">
        {/* Header card */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 animate-pulse-ring">
              <Activity className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {t("nearbyAlerts")}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                Within {NEARBY_RADIUS_KM} km of your farm
              </p>
            </div>
          </div>

          {/* Stats dashboard */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <StatPill label="Total" value={counts.total} tone="primary" />
            <StatPill label="Danger" value={counts.danger} tone="destructive" />
            <StatPill label="Warn" value={counts.warning} tone="warning" />
            <StatPill label="Safe" value={counts.safe} tone="success" />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filter by type
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {([
  "all",
  "PEST",
  "ANIMAL",
  "DISEASE",
  "WEATHER"
] as FilterKey[]).map((k) => (
              <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
                {k === "all" ? "All types" : t(typeMeta[k as Exclude<FilterKey, "all">].key)}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pt-1">
            <Filter className="w-3.5 h-3.5" /> Severity
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
            {([
  "all",
  "DANGER",
  "WARNING",
  "SAFE"
] as const).map((s) => (
              <Chip
                key={s}
                active={sevFilter === s}
                onClick={() => setSevFilter(s)}
                tone={s === "red" ? "destructive" : s === "yellow" ? "warning" : s === "green" ? "success" : undefined}
              >
                {s === "all" ? "All severity" : t(severityMeta[s].labelKey)}
              </Chip>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="mt-12 flex flex-col items-center text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-sm mt-2">Loading alerts...</span>
          </div>
        ) : enriched.length === 0 ? (
          <div className="mt-12 text-center">
            <div className="w-16 h-16 rounded-full bg-success/10 mx-auto flex items-center justify-center mb-3">
              <ShieldCheck className="w-7 h-7 text-success" />
            </div>
            <p className="text-base font-semibold text-foreground">
              {t("noAlerts")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Your area looks safe right now.
            </p>
          </div>
        ) : (
          <div className="mt-4 relative">
            {/* Timeline rail */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-border via-border to-transparent" />
            <div className="space-y-3">
              {enriched.map((a, i) => (
                <div
                  key={a.id}
                  className="animate-slide-in-right"
                  style={{ animationDelay: `${i * 50}ms`, opacity: 0 }}
                >
                  <AlertCard alert={a} t={t} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Floating Create button */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-xl mx-auto relative h-0">
          <button
            onClick={() => navigate("/alerts/new")}
            className="pointer-events-auto absolute bottom-6 right-4 h-14 px-5 rounded-full bg-gradient-primary text-primary-foreground shadow-elev flex items-center gap-2 font-semibold transition-smooth active:scale-95 hover:opacity-95"
          >
            <Plus className="w-5 h-5" />
            {t("createAlert")}
          </button>
        </div>
      </div>
    </div>
  );
};

const Chip = ({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone?: "destructive" | "warning" | "success";
}) => {
  const activeCls = tone
    ? {
        destructive: "bg-destructive text-destructive-foreground border-destructive",
        warning: "bg-warning text-foreground border-warning",
        success: "bg-success text-primary-foreground border-success",
      }[tone]
    : "bg-primary text-primary-foreground border-primary";
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap text-xs font-semibold px-3 py-1.5 rounded-full border transition-smooth active:scale-95 ${
        active ? activeCls + " shadow-button" : "bg-card text-muted-foreground border-border hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
};

const StatPill = ({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "destructive" | "warning" | "success";
}) => {
  const cls = {
    primary: "text-primary",
    destructive: "text-destructive",
    warning: "text-warning",
    success: "text-success",
  }[tone];
  return (
    <div className="bg-card/80 backdrop-blur rounded-xl p-2.5 border border-border/70 shadow-soft text-center">
      <div className={`text-lg font-bold leading-tight ${cls}`}>{value}</div>
      <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
};

const AlertCard = ({
  alert,
  t,
}: {
  alert: Alert & { distance: number };
  t: (k: any) => string;
}) => {
  const meta = typeMeta[alert.alert_type];
  const sev = severityMeta[alert.severity];
  const sevBg = {
    destructive: "bg-destructive/10 border-destructive/40 text-destructive",
    warning: "bg-warning/10 border-warning/40 text-warning",
    success: "bg-success/10 border-success/40 text-success",
  }[sev.color];
  const stripe = {
    destructive: "bg-destructive",
    warning: "bg-warning",
    success: "bg-success",
  }[sev.color];

  return (
    <div className="relative pl-10">
      {/* timeline node */}
      <div
        className={`absolute left-2.5 top-3 w-4 h-4 rounded-full border-2 border-card ${stripe}`}
      />
      <div className="bg-card rounded-xl shadow-soft border border-border overflow-hidden hover-lift">
        <div className={`h-1 ${stripe}`} />
        {alert.image_url ? (
          <div className="aspect-video bg-muted">
            <img
              src={alert.image_url}
              alt={t(meta.key)}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}
        <div className="p-3.5">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${sevBg}`}
            >
              <meta.Icon className="w-5 h-5" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground text-sm">
                  {t(meta.key)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${sevBg}`}
                >
                  <sev.Icon className="w-3 h-3" />
                  {t(sev.labelKey)}
                </span>
              </div>
              <p className="text-sm text-foreground mt-1 break-words leading-snug">
                {alert.description}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {alert.distance.toFixed(1)} {t("distanceAway")}
                </span>
                <span>·</span>
                <span>{timeAgo(alert.created_at, t)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Alerts;
