interface StatValueProps {
  value: number | string;
  unit?: string;
  className?: string;
}

export function StatValue({ value, unit, className }: StatValueProps) {
  return (
    <p
      className={`inline-flex items-baseline gap-1 font-inter font-black ${className ?? ""}`}
    >
      {value}
      {unit && <span className="text-[50%]">{unit}</span>}
    </p>
  );
}
