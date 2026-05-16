import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { getToken } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import {
  Bug,
  PawPrint,
  Leaf,
  CloudLightning,
  Camera,
  Upload,
  X,
  Send,
  Loader2,
  MapPin,
  ArrowLeft,
  ImageIcon,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

type AlertType =
  | "PEST"
  | "ANIMAL"
  | "DISEASE"
  | "WEATHER";

type Severity =
  | "DANGER"
  | "WARNING"
  | "SAFE";

const types = [

  {
    id: "PEST",
    Icon: Bug,
    key: "pest",
    tint: "text-destructive"
  },

  {
    id: "ANIMAL",
    Icon: PawPrint,
    key: "animal",
    tint: "text-warning"
  },

  {
    id: "DISEASE",
    Icon: Leaf,
    key: "disease",
    tint: "text-accent"
  },

  {
    id: "WEATHER",
    Icon: CloudLightning,
    key: "weatherDamage",
    tint: "text-secondary"
  },
];

const severities = [

  {
    id: "DANGER",
    key: "danger",
    Icon: ShieldAlert,
    activeCls:
      "bg-destructive/10 border-destructive text-destructive",
    dot: "bg-destructive",
  },

  {
    id: "WARNING",
    key: "warning",
    Icon: AlertTriangle,
    activeCls:
      "bg-warning/10 border-warning text-warning",
    dot: "bg-warning",
  },

  {
    id: "SAFE",
    key: "safe",
    Icon: ShieldCheck,
    activeCls:
      "bg-success/10 border-success text-success",
    dot: "bg-success",
  },
];

const CreateAlert = () => {
  const navigate = useNavigate();
  const { t, location } = useApp();
  const [alertType, setAlertType] = useState<AlertType | null>(null);
const [severity, setSeverity] =
  useState<Severity>("WARNING");  const [description, setDescription] = useState("");
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setImgFile(f);
      setImgPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async () => {

  if (!alertType || !description.trim()) {

    toast({
      title: "Please complete all fields"
    });

    return;
  }

  if (!location) {

    toast({
      title: t("locationNeeded")
    });

    return;
  }

  try {

    setSubmitting(true);

    const token = getToken();

    if (!token) {

      toast({

        title: "Login required",

        description:
          "Please login first",

        variant: "destructive",
      });

      return;
    }

    const formData = new FormData();

    formData.append(
      "alert_type",
      alertType
    );

    formData.append(
      "severity",
      severity
    );

    formData.append(
      "description",
      description.trim()
    );

    formData.append(
      "latitude",
      location.lat.toString()
    );

    formData.append(
      "longitude",
      location.lon.toString()
    );

    if (imgFile) {

      formData.append(
        "image",
        imgFile
      );
    }

    const response = await fetch(

      "http://127.0.0.1:8000/api/alerts/report/",

      {

        method: "POST",

        headers: {

          Authorization:
            `Bearer ${token}`,
        },

        body: formData,
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      throw new Error(

        data.detail ||
        data.error ||
        "Failed to create alert"
      );
    }

    toast({

      title:
        "✓ Alert posted successfully"
    });

    navigate("/alerts");

  } catch (err: any) {

    toast({

      title: "Failed",

      description:
        err.message,

      variant: "destructive",
    });

  } finally {

    setSubmitting(false);
  }
};

  const canSubmit = !!alertType && !!description.trim() && !submitting;
  const stepsDone =
    (alertType ? 1 : 0) + (severity ? 1 : 0) + (description.trim() ? 1 : 0);
  const progress = Math.round((stepsDone / 3) * 100);

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar showAlertsLink={false} />

      <div className="max-w-xl mx-auto px-4 pt-3 space-y-5">
        {/* Header card */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-card to-secondary/10 p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center shadow-soft hover:bg-muted transition-smooth"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground leading-tight">
                {t("createAlert")}
              </h1>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                {location
                  ? `${location.lat.toFixed(3)}, ${location.lon.toFixed(3)} · visible within 10 km`
                  : t("locationNeeded")}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              <span>Progress</span>
              <span>{stepsDone} / 3</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Type */}
        <Section
          step={1}
          title={t("alertType")}
          subtitle="What did you observe?"
          done={!!alertType}
        >
          <div className="grid grid-cols-2 gap-2.5">
            {types.map((tp) => {
              const active = alertType === tp.id;
              return (
                <button
                  key={tp.id}
                  onClick={() => setAlertType(tp.id)}
                  className={`group relative h-24 rounded-xl border-2 transition-smooth active:scale-[0.98] flex flex-col items-center justify-center gap-1.5 overflow-hidden ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-button"
                      : "bg-card text-foreground border-border shadow-soft hover:border-primary/40"
                  }`}
                >
                  <tp.Icon
                    className={`w-7 h-7 transition-smooth ${
                      active ? "" : tp.tint
                    } group-hover:scale-110`}
                    strokeWidth={2}
                  />
                  <span className="text-sm font-semibold">{t(tp.key)}</span>
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Severity */}
        <Section
          step={2}
          title={t("severity")}
          subtitle="How urgent is this for nearby farmers?"
          done
        >
          <div className="grid grid-cols-3 gap-2">
            {severities.map((s) => {
              const active = severity === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSeverity(s.id)}
                  className={`h-16 rounded-xl border-2 transition-smooth active:scale-[0.98] text-sm font-semibold flex flex-col items-center justify-center gap-1 ${
                    active
                      ? s.activeCls + " shadow-soft"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <s.Icon className="w-4 h-4" />
                  {t(s.key)}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Description */}
        <Section
          step={3}
          title={t("descriptionLabel")}
          subtitle="Add a short description so others can identify it."
          done={!!description.trim()}
        >
          <div className="relative">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              placeholder="e.g. Locust swarm seen on west side of field..."
              rows={4}
              className="w-full p-3.5 rounded-xl bg-card border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none text-sm shadow-soft transition-smooth resize-none"
            />
            <div className="absolute bottom-2 right-3 text-[10px] font-medium text-muted-foreground bg-card/80 px-1.5 rounded">
              {description.length} / 500
            </div>
          </div>
        </Section>

        {/* Image */}
        <Section
          step={4}
          title="Photo (optional)"
          subtitle="A clear photo helps neighbors react faster."
          done={!!imgPreview}
        >
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />

          {imgPreview ? (
            <div className="rounded-xl overflow-hidden shadow-card relative border border-border">
              <img src={imgPreview} alt="Alert" className="w-full h-52 object-cover" />
              <button
                onClick={() => {
                  setImgFile(null);
                  setImgPreview(null);
                }}
                className="absolute top-2 right-2 w-9 h-9 rounded-lg bg-card/95 backdrop-blur flex items-center justify-center shadow-soft border border-border hover:bg-card"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-card/90 backdrop-blur border border-border">
                <ImageIcon className="w-3 h-3 text-primary" />
                Attached
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => camRef.current?.click()}
                className="h-20 rounded-xl bg-card border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 shadow-soft flex flex-col items-center justify-center gap-1 transition-smooth active:scale-[0.98]"
              >
                <Camera className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold">{t("takePhoto")}</span>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="h-20 rounded-xl bg-card border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 shadow-soft flex flex-col items-center justify-center gap-1 transition-smooth active:scale-[0.98]"
              >
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold">{t("uploadImage")}</span>
              </button>
            </div>
          )}
        </Section>
      </div>

      {/* Sticky submit bar */}
      <div className="fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/90 backdrop-blur-md">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
              Posting as
            </div>
            <div className="text-xs font-semibold truncate flex items-center gap-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  severities.find((s) => s.id === severity)?.dot
                }`}
              />
              {alertType ? t(types.find((tp) => tp.id === alertType)!.key) : "Pick a type"}
              {" · "}
              {t(severities.find((s) => s.id === severity)!.key)}
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="flex-shrink-0 h-12 px-5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-button transition-smooth active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t("submitAlert")}
          </button>
        </div>
      </div>
    </div>
  );
};

const Section = ({
  step,
  title,
  subtitle,
  done,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  done?: boolean;
  children: React.ReactNode;
}) => (
  <section className="space-y-2.5">
    <div className="flex items-start gap-2.5">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 transition-smooth ${
          done
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground border border-border"
        }`}
      >
        {step}
      </div>
      <div className="flex-1">
        <h2 className="text-sm font-bold text-foreground leading-tight">{title}</h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
    <div className="pl-8.5" style={{ paddingLeft: "2.125rem" }}>
      {children}
    </div>
  </section>
);

export default CreateAlert;
