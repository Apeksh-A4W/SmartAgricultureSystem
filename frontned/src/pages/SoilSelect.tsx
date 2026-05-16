import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Check } from "lucide-react";
import { soilImages } from "@/lib/cropImages";

const topSoils = [
  { id: "sandy", key: "sandy" as const },
  { id: "clay", key: "clay" as const },
  { id: "loamy", key: "loamy" as const },
];

const moreSoils = [
  { id: "red", key: "red" as const },
  { id: "black", key: "black" as const },
  { id: "alluvial", key: "alluvial" as const },
  { id: "laterite", key: "laterite" as const },
  { id: "desert", key: "desert" as const },
];

const SoilSelect = () => {
  const navigate = useNavigate();
  const { t, setSoil } = useApp();
  const [showMore, setShowMore] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const handle = (id: string, name: string) => {
    setSelected(id);
    setSoil(name);
    setTimeout(() => navigate("/date"), 250);
  };

  const SoilRow = ({ id, name }: { id: string; name: string }) => (
    <button
      onClick={() => handle(id, name)}
      className={`w-full bg-card rounded-xl shadow-soft border transition-smooth active:scale-[0.99] hover:shadow-card flex items-center gap-3 p-3 ${
        selected === id ? "border-primary ring-2 ring-primary/30" : "border-border"
      }`}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        <img
          src={soilImages[id]}
          alt={`${name} soil texture`}
          className="w-full h-full object-cover"
          loading="lazy"
          width={64}
          height={64}
        />
      </div>
      <div className="flex-1 text-left">
        <div className="text-base font-semibold text-foreground">{name}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          Tap to select
        </div>
      </div>
      {selected === id ? (
        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>
      ) : (
        <span className="text-muted-foreground text-xl">›</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background pb-10">
      <TopBar />
      <ProgressSteps current={2} total={5} />

      <div className="px-4 pt-3">
        <h1 className="text-2xl font-bold text-foreground">{t("selectSoil")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("step")} 2 {t("of")} 5
        </p>

        <div className="mt-4 space-y-2.5">
          {topSoils.map((s) => (
            <SoilRow key={s.id} id={s.id} name={t(s.key)} />
          ))}
        </div>

        {!showMore ? (
          <button
            onClick={() => setShowMore(true)}
            className="mt-4 w-full h-12 rounded-xl bg-card border border-border text-primary font-semibold shadow-soft transition-smooth active:scale-[0.98] hover:bg-muted text-sm"
          >
            + {t("moreSoils")}
          </button>
        ) : (
          <div className="mt-4 space-y-2.5 animate-fade-up">
            {moreSoils.map((s) => (
              <SoilRow key={s.id} id={s.id} name={t(s.key)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SoilSelect;
