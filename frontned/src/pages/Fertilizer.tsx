import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Camera, Upload, Check, X, ArrowRight, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
const Fertilizer = () => {
  const navigate = useNavigate();
const {
  t,
  setFertilizer,
  setNpk,

  location,
  plantDate,
  soil,
  crop,
  fertilizer,
  npk,

  setWeatherData,
  setPredictionResult,
  setRecommendations
} = useApp();  const [choice, setChoice] = useState<boolean | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] =
  useState<File | null>(null);

const [ocrLoading, setOcrLoading] = useState(false);
const [ocrError, setOcrError] = useState<string | null>(null);
const [ocrResult, setOcrResult] = useState<any>(null);
const [predictionLoading, setPredictionLoading] = useState(false);
const [predictionError, setPredictionError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

    const handleFile = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const f = e.target.files?.[0];
  if (!f) return;

  setSelectedFile(f);
  setImgPreview(URL.createObjectURL(f));
  setOcrError(null);

  try {
    setOcrLoading(true);

    const formData = new FormData();
    formData.append("image", f);

    const data = await apiFetch("/ocr/extract/", {
      method: "POST",
      body: formData,
      headers: {}
    });

    setOcrResult(data);
    setNpk({
      nitrogen: Number(data.nitrogen || 0),
      phosphorus: Number(data.phosphorus || 0),
      potassium: Number(data.potassium || 0),
    });
  } catch (err: any) {
    const errorMsg = err.message || "Failed to extract NPK values. Please try again.";
    setOcrError(errorMsg);
    console.error("OCR Error:", err);
  } finally {
    setOcrLoading(false);
  }
};

const handleNext = async () => {
  try {
    setFertilizer(choice);
    setPredictionError(null);

    if (!location) {
      setPredictionError("Location data is missing. Please go back and provide location.");
      return;
    }

    setPredictionLoading(true);

    // FETCH CURRENT WEATHER
    const weatherData = await apiFetch(
      `/weather/current/?lat=${location.lat}&lon=${location.lon}`
    );

    // CALCULATE DAYS
    const daysToHarvest = plantDate
      ? Math.floor(
          (new Date().getTime() - new Date(plantDate).getTime()) /
          (1000 * 60 * 60 * 24)
        )
      : 90;

    // PREDICTION REQUEST
    const predictionData = await apiFetch("/predictions/predict/", {
      method: "POST",
      body: JSON.stringify({
        region: "South India",
        soil_type: soil || "loamy",
        crop: crop || "rice",
        rainfall_mm: weatherData.rainfall || 120,
        temperature_celsius: weatherData.temperature || 28,
        fertilizer_used: choice ? 1 : 0,
        irrigation_used: 1,
        weather_condition: weatherData.weather_condition || "Sunny",
        days_to_harvest: daysToHarvest
      }),
    });

    setPredictionResult(predictionData);

    // FETCH RECOMMENDATIONS
    const recommendationData = await apiFetch(
      "/recommendations/farming-advice/",
      {
        method: "POST",
        body: JSON.stringify({
          nitrogen: npk?.nitrogen || 0,
          phosphorus: npk?.phosphorus || 0,
          potassium: npk?.potassium || 0,
          temperature: weatherData?.temperature || 25,
          humidity: weatherData?.humidity || 60,
          rainfall: weatherData?.rainfall || 100,
          weather: weatherData?.weather_condition || "Sunny",
          prediction: predictionData?.prediction?.predicted_yield || 0,
          crop_type: crop || "rice",
          soil_type: soil || "loamy",
          irrigation_used: choice ? 1 : 0,
        }),
      }
    );

    // Handle both array and object responses
    const recs = Array.isArray(recommendationData) 
      ? recommendationData 
      : (recommendationData?.recommendations || []);
    
    setRecommendations(recs);

    navigate("/result");
  } catch (err: any) {
    const errorMsg = err.message || "Prediction failed. Please try again.";
    setPredictionError(errorMsg);
    console.error("Prediction Error:", err);
  } finally {
    setPredictionLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-background pb-10">
      <TopBar />
      <ProgressSteps current={4} total={5} />

      <div className="px-4 pt-3">
        <h1 className="text-2xl font-bold text-foreground">{t("fertilizer")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("step")} 4 {t("of")} 5
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setChoice(true)}
            className={`h-32 rounded-xl border-2 transition-smooth active:scale-[0.98] flex flex-col items-center justify-center gap-2 ${
              choice === true
                ? "bg-primary text-primary-foreground border-primary shadow-button"
                : "bg-card text-foreground border-border shadow-soft"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                choice === true ? "bg-white/15" : "bg-success/15"
              }`}
            >
              <Check
                className={`w-7 h-7 ${
                  choice === true ? "text-white" : "text-success"
                }`}
                strokeWidth={3}
              />
            </div>
            <span className="text-lg font-bold">{t("yes")}</span>
          </button>

          <button
            onClick={() => setChoice(false)}
            className={`h-32 rounded-xl border-2 transition-smooth active:scale-[0.98] flex flex-col items-center justify-center gap-2 ${
              choice === false
                ? "bg-destructive text-destructive-foreground border-destructive shadow-button"
                : "bg-card text-foreground border-border shadow-soft"
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                choice === false ? "bg-white/15" : "bg-destructive/15"
              }`}
            >
              <X
                className={`w-7 h-7 ${
                  choice === false ? "text-white" : "text-destructive"
                }`}
                strokeWidth={3}
              />
            </div>
            <span className="text-lg font-bold">{t("no")}</span>
          </button>
        </div>

        {choice === true && (
          <div className="mt-5 animate-fade-up space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFile}
            />
            <input
              ref={camRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleFile}
            />

            {ocrError && (
              <div className="bg-destructive/10 border border-destructive rounded-xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-destructive text-sm">OCR Error</p>
                  <p className="text-sm text-destructive/80">{ocrError}</p>
                </div>
              </div>
            )}

            {imgPreview && (
              <div className="rounded-xl overflow-hidden shadow-card relative border border-border">
                <img
                  src={imgPreview}
                  alt="Fertilizer"
                  className="w-full h-44 object-cover"
                />
                <button
                  onClick={() => setImgPreview(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-card/95 backdrop-blur flex items-center justify-center shadow-soft border border-border"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {ocrLoading && (
              <div className="bg-card border border-border rounded-xl p-4 text-center">
                <div className="animate-pulse">Extracting NPK values...</div>
              </div>
            )}
            {ocrResult && (
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-bold mb-3">Extracted NPK Values</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <div className="text-xs text-muted-foreground">Nitrogen</div>
                    <div className="text-xl font-bold">{ocrResult.nitrogen || 0}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <div className="text-xs text-muted-foreground">Phosphorus</div>
                    <div className="text-xl font-bold">{ocrResult.phosphorus || 0}</div>
                  </div>
                  <div className="rounded-lg bg-muted p-3 text-center">
                    <div className="text-xs text-muted-foreground">Potassium</div>
                    <div className="text-xl font-bold">{ocrResult.potassium || 0}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={ocrLoading || predictionLoading}
                className="h-16 rounded-xl bg-card border border-border shadow-soft flex flex-col items-center justify-center gap-1 transition-smooth active:scale-[0.98] hover:bg-muted disabled:opacity-50"
              >
                <Upload className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold">{t("uploadImage")}</span>
              </button>
              <button
                onClick={() => camRef.current?.click()}
                disabled={ocrLoading || predictionLoading}
                className="h-16 rounded-xl bg-card border border-border shadow-soft flex flex-col items-center justify-center gap-1 transition-smooth active:scale-[0.98] hover:bg-muted disabled:opacity-50"
              >
                <Camera className="w-5 h-5 text-primary" />
                <span className="text-xs font-semibold">{t("takePhoto")}</span>
              </button>
            </div>
          </div>
        )}

        {predictionError && (
          <div className="mt-4 bg-destructive/10 border border-destructive rounded-xl p-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive text-sm">Error</p>
              <p className="text-sm text-destructive/80">{predictionError}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={choice === null || predictionLoading}
          className="mt-6 w-full h-13 py-3.5 rounded-xl bg-primary text-primary-foreground text-base font-semibold shadow-button transition-smooth active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {predictionLoading ? "Processing..." : `${t("continue")} `}
          {!predictionLoading && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default Fertilizer;
