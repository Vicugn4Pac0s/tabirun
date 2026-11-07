"use client";
import { useController, type UseFormReturn } from "react-hook-form";
import type { FormEvent } from "react";
import type { UserInitialProfileInput } from "~/shared/schemas";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import { Input } from "~/frontend/components/ui/input";
import { Button } from "~/frontend/components/ui/button";

type SelectOption = {
  value: string;
  label: string;
};

const genderOptions: SelectOption[] = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
];

type InitialProfileFormProps = {
  form: UseFormReturn<UserInitialProfileInput>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
};
const toOptionalString = (value: string) => (value === "" ? undefined : value);

const toOptionalInt = (value: string) =>
  value === "" ? undefined : Number.parseInt(value, 10);

export function InitialProfileForm({
  form,
  onSubmit,
  isSubmitting,
}: InitialProfileFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const { field: gender } = useController({ control, name: "gender" });
  const { field: pace } = useController({ control, name: "pace" });
  const disabled = isSubmitting;
  const birthDateError = errors.birthDate?.message;
  const genderError = errors.gender?.message;
  const paceError = errors.pace?.message;
  const heightError = errors.height?.message;
  const weightError = errors.weight?.message;
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <div className="space-y-1">
        <label className="text-sm font-medium">生年月日</label>
        <Input
          type="date"
          disabled={disabled}
          {...register("birthDate", {
            setValueAs: toOptionalString,
          })}
        />
        {birthDateError && (
          <p className="text-sm text-red-500">{birthDateError}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">性別</label>
        <Selectbox
          items={genderOptions}
          value={gender.value}
          onValueChange={gender.onChange}
          placeholder="選択してください"
          className="w-full"
          disabled={disabled}
        />
        {genderError && <p className="text-sm text-red-500">{genderError}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">ランニングのペース</label>
        <PaceSelect
          value={pace.value}
          onChangeValue={pace.onChange}
          placeholder="選択してください"
          disabled={disabled}
        />
        {paceError && <p className="text-sm text-red-500">{paceError}</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">身長(cm)</label>
          <Input
            type="number"
            inputMode="numeric"
            disabled={disabled}
            {...register("height", {
              setValueAs: toOptionalInt,
            })}
          />
          {heightError && <p className="text-sm text-red-500">{heightError}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">体重(kg)</label>
          <Input
            type="number"
            inputMode="numeric"
            disabled={disabled}
            {...register("weight", {
              setValueAs: toOptionalInt,
            })}
          />
          {weightError && <p className="text-sm text-red-500">{weightError}</p>}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "保存中..." : "初期設定を完了"}
      </Button>
    </form>
  );
}
