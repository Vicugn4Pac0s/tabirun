interface StatValueProps {
  value: number | string;
  unit?: string;
  className?: string;
}

export function StatValue({ value, unit, className }: StatValueProps) {
  return (
    <p className={`font-black inline-flex items-baseline gap-1 ${className ?? ""}`}>{value}{unit && <span className="text-[50%]">{unit}</span>}</p>
  )
}