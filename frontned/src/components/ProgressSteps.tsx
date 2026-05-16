interface ProgressStepsProps {
  current: number;
  total: number;
}

export const ProgressSteps = ({ current, total }: ProgressStepsProps) => {
  return (
    <div className="px-4 pt-3 pb-1">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full flex-1 transition-smooth ${
              i < current ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
