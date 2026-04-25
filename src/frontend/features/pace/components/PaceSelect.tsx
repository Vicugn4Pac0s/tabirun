import { Pace } from "~/frontend/types/pace";
import { usePacesQuery } from "../hooks/usePacesQuery";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";

interface PaceSelectProps {
  value?: Pace;
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
  const { paces } = usePacesQuery();

  const paceOptions =
    paces?.map((pace) => ({
      value: pace.value,
      label: pace.value,
    })) || [];

  const isPace = (value: string): value is Pace => {
    return paces?.some((pace) => pace.value === value) ?? false;
  };

  return (
    <Selectbox
      items={paceOptions}
      value={value}
      onValueChange={(value) => {
        if (isPace(value)) {
          onChangeValue(value);
        }
      }}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full ${className || ""}`}
    />
  );
}

export default PaceSelect;