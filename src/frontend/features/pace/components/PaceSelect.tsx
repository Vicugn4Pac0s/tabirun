import { Pace } from "~/frontend/types/pace";
import { usePacesQuery } from "../hooks/usePacesQuery";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";

interface PaceSelectProps {
  value?: string;
  onChangeValue: (pace: Pace) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function PaceSelect({
  value,
  onChangeValue,
  placeholder = "選択してください",
  className,
  disabled,
}: PaceSelectProps) {
  const { paces, error } = usePacesQuery();

  const paceOptions =
    paces?.map((pace) => ({
      value: pace.value,
      label: pace.value,
    })) || [];

  const isPace = (value: string): value is Pace => {
    return paces?.some((pace) => pace.value === value) ?? false;
  };

  return (
    <div className={`w-full ${className || ""}`}>
      <Selectbox
        items={paceOptions}
        value={value}
        onValueChange={(value) => {
          if (isPace(value)) {
            onChangeValue(value);
          }
        }}
        placeholder={placeholder}
        disabled={disabled || !!error}
        className="w-full"
      />
      {error && (
        <p className="mt-2 text-sm text-red-500">
          ペース一覧の取得に失敗しました。時間をおいて再度お試しください。
        </p>
      )}
    </div>
  );
}

export default PaceSelect;
