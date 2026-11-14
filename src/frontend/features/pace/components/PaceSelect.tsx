import type { ComponentPropsWithoutRef } from "react";
import { type Pace } from "~/frontend/types/pace";
import { usePacesQuery } from "../api/usePacesQuery";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";

type PaceSelectProps = {
  value?: string;
  onChangeValue: (pace: Pace) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
} & Pick<
  ComponentPropsWithoutRef<"button">,
  "id" | "onBlur" | "aria-invalid" | "aria-describedby"
>;

/**
 * ペース一覧を取得して選択肢にし、一覧に存在する値だけを変更通知する。
 * 取得失敗時は選択を無効にしてエラーを表示する。
 */
function PaceSelect({
  value,
  onChangeValue,
  placeholder = "選択してください",
  className,
  disabled,
  id,
  ...triggerProps
}: PaceSelectProps) {
  const { paces, error } = usePacesQuery();

  const paceOptions =
    paces?.map((pace) => ({
      value: pace.value,
      label: pace.value,
    })) ?? [];

  const isPace = (value: string): value is Pace => {
    return paces?.some((pace) => pace.value === value) ?? false;
  };

  return (
    <div className={`w-full ${className ?? ""}`}>
      <Selectbox
        {...triggerProps}
        id={id}
        ariaLabel={id ? undefined : "ペース"}
        items={paceOptions}
        value={value}
        onValueChange={(value) => {
          if (isPace(value)) {
            onChangeValue(value);
          }
        }}
        placeholder={placeholder}
        disabled={(disabled ?? false) || Boolean(error)}
        className="w-full"
      />
      {error && (
        <p role="alert" className="mt-2 text-sm text-destructive">
          ペース一覧を取得できませんでした。時間をおいて再度お試しください。
        </p>
      )}
    </div>
  );
}

export default PaceSelect;
