import { Pace } from "~/frontend/types/pace";
import { usePacesQuery } from "../hooks/usePacesQuery";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";

interface PaceSelectProps {
  value: Pace;
  onChangeValue: (pace: Pace) => void;
  className?: string;
}

function PaceSelect({ value, onChangeValue, className }: PaceSelectProps) {
  const { paces } = usePacesQuery();
  const paceOptions = paces?.map((pace) => ({ value: pace.value, label: pace.value })) || [];
  
  return (
    <Selectbox items={paceOptions} value={value} onValueChange={(value) => onChangeValue(value as Pace)} className={`w-full ${className || ""}`}/>
  )
}

export default PaceSelect;