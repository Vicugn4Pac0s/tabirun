"use client";
import { useController, type UseFormReturn } from "react-hook-form";
import type { FormEvent } from "react";
import type { UserProfileUpdateInput } from "~/shared/schemas";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import { Input } from "~/frontend/components/ui/input";
import { Button } from "~/frontend/components/ui/button";
import { FormField } from "~/frontend/components/app-ui/FormField";
import { genderOptions } from "~/frontend/features/user/constants";

type UserProfileEditFormProps = {
  form: UseFormReturn<UserProfileUpdateInput>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
};
const toOptionalString = (value: string) => (value === "" ? undefined : value);

const toOptionalNumber = (value: string) =>
  value === "" ? undefined : Number(value);

/**
 * プロフィールの入力欄を呼出側のformに接続し、更新中は入力・送信を無効にする。
 * 空欄はundefinedに変換し、検証・保存は渡されたformとonSubmitに任せる。
 */
export function UserProfileEditForm({
  form,
  onSubmit,
  isSubmitting,
}: UserProfileEditFormProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const { field: gender } = useController({ control, name: "gender" });
  const { field: pace } = useController({ control, name: "pace" });
  // zodResolverはパスのないフォーム全体のエラーを空文字キーに格納する。
  const formError = Object.entries(errors).find(([field]) => field === "")?.[1]
    ?.message;
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

      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "更新中..." : "保存する"}
      </Button>
    </form>
  );
}
