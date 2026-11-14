"use client";
import { useController, type UseFormReturn } from "react-hook-form";
import { useId, type FormEvent } from "react";
import type { UserProfileUpdateInput } from "~/shared/schemas";
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

type UserProfileEditFormProps = {
  form: UseFormReturn<UserProfileUpdateInput>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
};
const toOptionalString = (value: string) => (value === "" ? undefined : value);

const toOptionalInt = (value: string) =>
  value === "" ? undefined : Number.parseInt(value, 10);

/**
 * プロフィールの入力欄を呼出側のformに接続し、更新中は入力・送信を無効にする。
 * 空欄はundefinedに変換し、検証・保存は渡されたformとonSubmitに任せる。
 */
export function UserProfileEditForm({
  form,
  onSubmit,
  isSubmitting,
}: UserProfileEditFormProps) {
  const formId = useId();
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
        <label htmlFor={`${formId}-birthDate`} className="text-sm font-medium">
          生年月日
        </label>
        <Input
          id={`${formId}-birthDate`}
          aria-invalid={Boolean(birthDateError)}
          aria-describedby={
            birthDateError ? `${formId}-birthDate-error` : undefined
          }
          type="date"
          disabled={disabled}
          {...register("birthDate", {
            setValueAs: toOptionalString,
          })}
        />
        {birthDateError && (
          <p
            id={`${formId}-birthDate-error`}
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {birthDateError}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor={`${formId}-gender`} className="text-sm font-medium">
          性別
        </label>
        <Selectbox
          id={`${formId}-gender`}
          aria-invalid={Boolean(genderError)}
          aria-describedby={genderError ? `${formId}-gender-error` : undefined}
          onBlur={gender.onBlur}
          items={genderOptions}
          value={gender.value}
          onValueChange={gender.onChange}
          placeholder="選択してください"
          className="w-full"
          disabled={disabled}
        />
        {genderError && (
          <p
            id={`${formId}-gender-error`}
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {genderError}
          </p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor={`${formId}-pace`} className="text-sm font-medium">
          ランニングのペース
        </label>
        <PaceSelect
          id={`${formId}-pace`}
          aria-invalid={Boolean(paceError)}
          aria-describedby={paceError ? `${formId}-pace-error` : undefined}
          onBlur={pace.onBlur}
          value={pace.value}
          onChangeValue={pace.onChange}
          placeholder="選択してください"
          disabled={disabled}
        />
        {paceError && (
          <p
            id={`${formId}-pace-error`}
            role="alert"
            className="mt-1 text-sm text-destructive"
          >
            {paceError}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={`${formId}-height`} className="text-sm font-medium">
            身長(cm)
          </label>
          <Input
            id={`${formId}-height`}
            aria-invalid={Boolean(heightError)}
            aria-describedby={
              heightError ? `${formId}-height-error` : undefined
            }
            type="number"
            inputMode="numeric"
            disabled={disabled}
            {...register("height", {
              setValueAs: toOptionalInt,
            })}
          />
          {heightError && (
            <p
              id={`${formId}-height-error`}
              role="alert"
              className="mt-1 text-sm text-destructive"
            >
              {heightError}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label htmlFor={`${formId}-weight`} className="text-sm font-medium">
            体重(kg)
          </label>
          <Input
            id={`${formId}-weight`}
            aria-invalid={Boolean(weightError)}
            aria-describedby={
              weightError ? `${formId}-weight-error` : undefined
            }
            type="number"
            inputMode="numeric"
            disabled={disabled}
            {...register("weight", {
              setValueAs: toOptionalInt,
            })}
          />
          {weightError && (
            <p
              id={`${formId}-weight-error`}
              role="alert"
              className="mt-1 text-sm text-destructive"
            >
              {weightError}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "更新中..." : "保存する"}
      </Button>
    </form>
  );
}
