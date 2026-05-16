import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { MapPin, Satellite } from "lucide-react";

const Loading = () => {
  const navigate = useNavigate();
  const { t, setLocation } = useApp();
  const [status, setStatus] = useState<string>(t("detectingLocation"));

  useEffect(() => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setTimeout(() => navigate("/crop"), 500);
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setStatus(t("fetchingData"));
          setTimeout(finish, 900);
        },
        () => {
          setLocation({ lat: 12.9716, lon: 77.5946 });
          setStatus(t("fetchingData"));
          setTimeout(finish, 900);
        },
        { timeout: 5000 }
      );
    } else {
      setLocation({ lat: 12.9716, lon: 77.5946 });
      setTimeout(finish, 1200);
    }
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col items-center justify-center px-6">
      <div className="text-center animate-scale-in">
        <div className="relative w-24 h-24 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-primary/15 animate-pulse-ring" />
          <div className="relative w-full h-full rounded-full bg-card shadow-elev flex items-center justify-center border border-border">
            <Satellite className="w-10 h-10 text-primary" />
          </div>
        </div>

        <div className="bg-card rounded-2xl px-6 py-5 shadow-card max-w-sm border border-border">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
              GPS
            </span>
          </div>
          <p className="text-base font-semibold text-foreground">{status}</p>
          <div className="mt-4 flex justify-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.3s]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
