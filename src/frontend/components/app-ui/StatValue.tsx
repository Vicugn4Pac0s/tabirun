interface StatValueProps {
  value: number | string;
  unit?: string;
  className?: string;
}

/** 計測値と縮小した単位をベースラインを揃えて表示する。値の丸めや整形は呼出側で行う。 */
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
