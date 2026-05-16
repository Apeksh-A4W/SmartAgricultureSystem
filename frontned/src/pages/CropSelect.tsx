import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { TopBar } from "@/components/TopBar";
import { ProgressSteps } from "@/components/ProgressSteps";
import { Search, Check } from "lucide-react";
import { cropImages } from "@/lib/cropImages";

const topCrops = [
  { id: "rice", key: "rice" as const },
  { id: "wheat", key: "wheat" as const },
  { id: "maize", key: "maize" as const },
  { id: "cotton", key: "cotton" as const },
  { id: "sugarcane", key: "sugarcane" as const },
];

const moreCrops = [
  { id: "barley", name: "Barley" },
  { id: "millet", name: "Millet" },
  { id: "pulses", name: "Pulses" },
  { id: "soybean", name: "Soybean" },
  { id: "groundnut", name: "Groundnut" },
  { id: "mustard", name: "Mustard" },
  { id: "tea", name: "Tea" },
  { id: "coffee", name: "Coffee" },
  { id: "jute", name: "Jute" },
  { id: "tobacco", name: "Tobacco" },
  { id: "potato", name: "Potato" },
  { id: "onion", name: "Onion" },
  { id: "tomato", name: "Tomato" },
  { id: "chili", name: "Chili" },
  { id: "banana", name: "Banana" },
  { id: "mango", name: "Mango" },
  { id: "coconut", name: "Coconut" },
  { id: "turmeric", name: "Turmeric" },
];

const CropSelect = () => {
  const navigate = useNavigate();
  const { t, setCrop } = useApp();
  const [showMore, setShowMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const allCrops = [
    ...topCrops.map((c) => ({ id: c.id, name: t(c.key), image: cropImages[c.id] })),
    ...moreCrops.map((c) => ({ ...c, image: cropImages[c.id] })),
  ];
  const filtered = query
    ? allCrops.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : null;

  const handleSelect = (id: string, name: string) => {
    setSelected(id);
    setCrop(name);
    setTimeout(() => navigate("/soil"), 250);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <TopBar />
      <ProgressSteps current={1} total={5} />

      <div className="px-4 pt-3">
        <h1 className="text-2xl font-bold text-foreground">{t("selectCrop")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t("step")} 1 {t("of")} 5
        </p>

        <div className="mt-4 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchCrop")}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-card border border-border focus:border-primary outline-none text-sm shadow-soft transition-smooth"
          />
        </div>

        {filtered ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {filtered.map((c) => (
              <CropCard
                key={c.id}
                image={c.image}
                name={c.name}
                selected={selected === c.id}
                onClick={() => handleSelect(c.id, c.name)}
              />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {topCrops.map((c) => (
                <CropCard
                  key={c.id}
                  image={cropImages[c.id]}
                  name={t(c.key)}
                  selected={selected === c.id}
                  onClick={() => handleSelect(c.id, t(c.key))}
                />
              ))}
            </div>

            {!showMore ? (
              <button
                onClick={() => setShowMore(true)}
                className="mt-4 w-full h-12 rounded-xl bg-card border border-border text-primary font-semibold shadow-soft transition-smooth active:scale-[0.98] hover:bg-muted text-sm"
              >
                + {t("moreCrops")}
              </button>
            ) : (
              <div className="mt-5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  {t("moreCrops")}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {moreCrops.map((c) => (
                    <CropCard
                      key={c.id}
                      image={cropImages[c.id]}
                      name={c.name}
                      selected={selected === c.id}
                      onClick={() => handleSelect(c.id, c.name)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const CropCard = ({
  image,
  name,
  selected,
  onClick,
}: {
  image?: string;
  name: string;
  selected?: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`bg-card rounded-xl shadow-soft border overflow-hidden transition-smooth active:scale-[0.98] hover:shadow-card text-left ${
      selected ? "border-primary ring-2 ring-primary/30" : "border-border"
    }`}
  >
    <div className="relative aspect-[4/3] bg-muted">
      {image ? (
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
          width={512}
          height={384}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
          {name}
        </div>
      )}
      {selected && (
        <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-button">
          <Check className="w-4 h-4" strokeWidth={3} />
        </div>
      )}
    </div>
    <div className="p-2.5">
      <span className="text-sm font-semibold text-foreground">{name}</span>
    </div>
  </button>
);

export default CropSelect;
