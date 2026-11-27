"use client";
import { useController, type UseFormReturn } from "react-hook-form";
import type { FormEvent } from "react";
import type { UserInitialProfileInput } from "~/shared/schemas";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import { Input } from "~/frontend/components/ui/input";
import { PrimaryButton } from "~/frontend/components/app-ui/PrimaryButton";
import { FormField } from "~/frontend/components/app-ui/FormField";
import { genderOptions } from "~/frontend/features/user/constants";

type InitialProfileFormProps = {
  form: UseFormReturn<UserInitialProfileInput>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
};
const toOptionalString = (value: string) => (value === "" ? undefined : value);

const toOptionalNumber = (value: string) =>
  value === "" ? undefined : Number(value);

/**
 * 初期設定の入力欄を呼出側のformに接続し、保存中は入力・送信を無効にする。
 * 空欄はundefinedに変換し、検証・保存は渡されたformとonSubmitに任せる。
 */
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
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
    >
      <FormField label="生年月日" error={errors.birthDate?.message}>
        {(fieldProps) => (
          <Input
            {...fieldProps}
            type="date"
            disabled={disabled}
            {...register("birthDate", {
              setValueAs: toOptionalString,
            })}
          />
        )}
      </FormField>

      <FormField label="性別" error={errors.gender?.message}>
        {(fieldProps) => (
          <Selectbox
            {...fieldProps}
            onBlur={gender.onBlur}
            items={genderOptions}
            value={gender.value}
            onValueChange={gender.onChange}
            placeholder="選択してください"
            className="w-full"
            disabled={disabled}
          />
        )}
      </FormField>

      <FormField label="ランニングのペース" error={errors.pace?.message}>
        {(fieldProps) => (
          <PaceSelect
            {...fieldProps}
            onBlur={pace.onBlur}
            value={pace.value}
            onChangeValue={pace.onChange}
            placeholder="選択してください"
            disabled={disabled}
          />
        )}
      </FormField>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="身長(cm)" error={errors.height?.message}>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              step="any"
              inputMode="numeric"
              disabled={disabled}
              {...register("height", {
                setValueAs: toOptionalNumber,
              })}
            />
          )}
        </FormField>

        <FormField label="体重(kg)" error={errors.weight?.message}>
          {(fieldProps) => (
            <Input
              {...fieldProps}
              type="number"
              step="any"
              inputMode="numeric"
              disabled={disabled}
              {...register("weight", {
                setValueAs: toOptionalNumber,
              })}
            />
          )}
        </FormField>
      </div>

      <PrimaryButton
        type="submit"
        className="w-full text-sm font-medium"
        disabled={isSubmitting}
      >
        {isSubmitting ? "保存中..." : "初期設定を完了"}
      </PrimaryButton>
    </form>
  );
}
