import { createContext, useContext, useState, ReactNode } from "react";
import { Language, translations, TranslationKey } from "@/lib/i18n";
interface AppState {
  lang: Language;
  setLang: (l: Language) => void;

  t: (k: TranslationKey) => string;

  crop: string | null;
  setCrop: (c: string | null) => void;

  soil: string | null;
  setSoil: (s: string | null) => void;

  plantDate: Date | null;
  setPlantDate: (d: Date | null) => void;

  fertilizer: boolean | null;
  setFertilizer: (f: boolean | null) => void;

  location: { lat: number; lon: number } | null;
  setLocation: (
    l: { lat: number; lon: number } | null
  ) => void;

  npk: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
  } | null;

  setNpk: (
    n: {
      nitrogen: number;
      phosphorus: number;
      potassium: number;
    } | null
  ) => void;

  predictionResult: any;
  setPredictionResult: (p: any) => void;

  weatherData: any;
  setWeatherData: (w: any) => void;

  recommendations: string[];
  setRecommendations: (r: string[]) => void;
}


const Ctx = createContext<AppState | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>("en");
  const [crop, setCrop] = useState<string | null>(null);
  const [soil, setSoil] = useState<string | null>(null);
  const [plantDate, setPlantDate] = useState<Date | null>(null);
  const [fertilizer, setFertilizer] = useState<boolean | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [npk, setNpk] = useState<{

  nitrogen: number;

  phosphorus: number;

  potassium: number;

} | null>(null);
const [predictionResult, setPredictionResult] =
  useState<any>(null);

const [weatherData, setWeatherData] =
  useState<any>(null);

const [recommendations, setRecommendations] =
  useState<string[]>([]);
  const t = (k: TranslationKey) => translations[lang][k] || translations.en[k];

  return (
    <Ctx.Provider
      value={{

  lang,
  setLang,
  t,

  crop,
  setCrop,

  soil,
  setSoil,

  plantDate,
  setPlantDate,

  fertilizer,
  setFertilizer,

  npk,
  setNpk,

  location,
  setLocation,

  predictionResult,
  setPredictionResult,

  weatherData,
  setWeatherData,

  recommendations,
  setRecommendations
}}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
};
