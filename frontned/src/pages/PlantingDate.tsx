import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, differenceInDays } from "date-fns";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalIcon, Sprout, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PlantingDate = () => {
  const navigate = useNavigate();
  const { t, plantDate, setPlantDate } = useApp();
  const [date, setDate] = useState<Date | undefined>(plantDate || undefined);

  const days = date ? differenceInDays(new Date(), date) : 0;

  const handleNext = () => {
    if (date) {
      setPlantDate(date);
      navigate("/fertilizer");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <TopBar />
      <ProgressSteps current={3} total={5} />

      <div className="px-4 pt-3">
        <h1 className="text-2xl font-bold text-foreground">{t("plantingDate")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("step")} 3 {t("of")} 5
        </p>

        <div className="mt-4 bg-card rounded-xl shadow-card border border-border p-2 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={(d) => d > new Date()}
            initialFocus
            className={cn("p-2 pointer-events-auto")}
          />
        </div>

        {date && (
          <div className="mt-4 grid grid-cols-2 gap-3 animate-fade-up">
            <div className="bg-card rounded-xl p-3.5 shadow-soft border border-border">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <CalIcon className="w-3.5 h-3.5" /> {t("plantedOn")}
              </div>
              <div className="text-base font-bold mt-1 text-foreground">
                {format(date, "dd MMM yyyy")}
              </div>
            </div>
            <div className="bg-card rounded-xl p-3.5 shadow-soft border border-border">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sprout className="w-3.5 h-3.5" /> {t("daysSince")}
              </div>
              <div className="text-2xl font-bold text-primary mt-1">
                {days}
                <span className="text-xs font-medium text-muted-foreground ml-1">
                  days
                </span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={!date}
          className="mt-6 w-full h-13 py-3.5 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow-button transition-smooth active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {t("continue")} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default PlantingDate;
