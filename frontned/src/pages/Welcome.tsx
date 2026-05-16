import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import {
  Sprout,
  ArrowRight,
  Bell,
  PlayCircle,
  MapPin,
  Leaf,
  TrendingUp,
  CloudSun,
  ShieldCheck,
  Sparkles,
  
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import farmHero from "@/assets/farm-hero-pro.jpg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEMO_VIDEO_ID = "dQw4w9WgXcQ";

const howSteps = [
  { Icon: MapPin, title: "Locate your farm", text: "We auto-detect your region for accurate forecasts." },
  { Icon: Leaf, title: "Pick crop & soil", text: "Choose from 20+ real crops and soil types." },
  { Icon: CloudSun, title: "Get instant prediction", text: "AI yields, weather and growth-stage advice." },
  { Icon: TrendingUp, title: "Track market prices", text: "Live mandi rates with trend charts." },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { t } = useApp();
  const { isAuthenticated } = useAuth();
  const [demoOpen, setDemoOpen] = useState(false);


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopBar showBack={false} transparent />

      {/* Hero */}
      <div className="relative h-[58vh] min-h-[400px] -mt-16">
        <img
          src={farmHero}
          alt="Lush farmland at sunrise with rolling green hills"
          className="w-full h-full object-cover"
          width={1024}
          height={1280}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/40 via-foreground/10 to-background" />

        <div className="absolute top-24 left-6 right-6 animate-fade-up">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card/90 backdrop-blur text-xs font-semibold text-primary shadow-soft">
            <Sparkles className="w-3.5 h-3.5" /> AI-powered agriculture
          </span>
          <h1 className="text-4xl font-bold text-white mt-3 leading-tight drop-shadow-lg">
            Smarter farms,<br />better harvests.
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-5 pb-10 -mt-24 relative z-10">
        <div className="bg-card rounded-3xl p-6 shadow-elev animate-fade-up border border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-button">
              <Sprout className="w-6 h-6 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground leading-tight">
                {t("appName")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("tagline")}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
            Get accurate yield forecasts, weather insights, and live mandi prices —
            tailored to your farm.
          </p>

          <button
           onClick={() => {

  if (isAuthenticated) {

    navigate("/loading");

  } else {

    alert("Please login first");

  }
}}
            className="mt-5 group w-full h-13 py-3.5 rounded-xl bg-gradient-primary text-primary-foreground text-base font-semibold shadow-button transition-smooth active:scale-[0.98] hover:opacity-95 flex items-center justify-center gap-2"
          >
            {t("start")}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

         

          <button
            onClick={() => setDemoOpen(true)}
            className="mt-3 w-full h-12 rounded-xl relative overflow-hidden text-sm font-semibold transition-smooth active:scale-[0.98] flex items-center justify-center gap-2 group border border-secondary/40 bg-gradient-to-r from-secondary/10 via-card to-secondary/10 text-foreground hover:from-secondary/20 hover:to-secondary/20"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-secondary/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <PlayCircle className="w-5 h-5 text-secondary" />
            How to Use • Watch Demo
          </button>

          <button
            onClick={() => navigate("/alerts")}
            className="mt-3 w-full h-12 rounded-xl bg-card border border-border text-foreground text-sm font-semibold transition-smooth active:scale-[0.98] hover:bg-muted flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4 text-primary" />
            {t("viewAlerts")}
          </button>
        </div>

        {/* Feature highlights */}
        <div className="mt-6 grid grid-cols-2 gap-3 animate-fade-up">
          <FeatureCard Icon={TrendingUp} title="Yield AI" sub="Forecast accuracy" tone="primary" />
          <FeatureCard Icon={CloudSun} title="Weather" sub="5-day outlook" tone="secondary" />
          <FeatureCard Icon={ShieldCheck} title="Alerts" sub="Within 10 km" tone="accent" />
          <FeatureCard Icon={Leaf} title="Advice" sub="Smart tips" tone="primary" />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          <Stat label="Crops" value="20+" />
          <Stat label="Languages" value="3" />
          <Stat label="Free" value="✓" />
        </div>
      </div>

      

      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-2xl">
          <div className="bg-gradient-primary p-5 text-primary-foreground relative">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <PlayCircle className="w-5 h-5" /> How Smart Farming works
              </DialogTitle>
            </DialogHeader>
            <p className="text-sm opacity-90 mt-1">
              4 quick steps to your first prediction
            </p>
          </div>
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-card" style={{ paddingTop: "56.25%" }}>
              {demoOpen && (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${DEMO_VIDEO_ID}?rel=0`}
                  title="Smart Farming demo video"
                  frameBorder={0}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {howSteps.map((s, i) => (
                <div
                  key={i}
                  className="flex gap-3 p-3 rounded-xl bg-muted/40 border border-border hover-lift"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <s.Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-primary">STEP {i + 1}</div>
                    <div className="text-sm font-semibold text-foreground">{s.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const FeatureCard = ({
  Icon,
  title,
  sub,
  tone,
}: {
  Icon: any;
  title: string;
  sub: string;
  tone: "primary" | "secondary" | "accent";
}) => {
  const toneCls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    accent: "bg-accent/10 text-accent",
  }[tone];
  return (
    <div className="bg-card rounded-2xl p-3.5 border border-border shadow-soft hover-lift flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${toneCls}`}>
        <Icon className="w-5 h-5" strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card rounded-xl p-3 shadow-soft border border-border text-center">
    <div className="text-lg font-bold text-primary">{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

export default Welcome;
