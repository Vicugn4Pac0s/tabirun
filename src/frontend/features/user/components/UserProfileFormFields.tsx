"use client";

import { Controller, type Control, type FieldErrors, type FieldError, type UseFormRegister } from "react-hook-form";

import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import { Input } from "~/frontend/components/ui/input";

type SelectOption = {
  value: string;
  label: string;
};

export type UserProfileFormValues = {
  birthDate?: string;
  gender?: string;
  pace?: string;
  height?: number;
  weight?: number;
};

type UserProfileFormFieldsProps = {
  register: UseFormRegister<UserProfileFormValues>;
  control: Control<UserProfileFormValues>;
  errors: FieldErrors<UserProfileFormValues>;
  genderOptions: SelectOption[];
  disabled: boolean;
};

const toOptionalString = (value: string) => (value === "" ? undefined : value);

const toOptionalInt = (value: string) =>
  value === "" ? undefined : Number.parseInt(value, 10);

const getErrorMessage = (error: FieldError | undefined) => error?.message;

export const UserProfileFormFields = ({
  register,
  control,
  errors,
  genderOptions,
  disabled,
}: UserProfileFormFieldsProps) => {
  const birthDateError = getErrorMessage(errors.birthDate);
  const genderError = getErrorMessage(errors.gender);
  const paceError = getErrorMessage(errors.pace);
  const heightError = getErrorMessage(errors.height);
  const weightError = getErrorMessage(errors.weight);

  return (
    <>
      <div className="space-y-1">
        <label className="text-sm font-medium">生年月日</label>
        <Input
          type="date"
          disabled={disabled}
          {...register("birthDate", {
            setValueAs: toOptionalString,
          })}
        />
        {birthDateError && <p className="text-sm text-red-500">{birthDateError}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">性別</label>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Selectbox
              items={genderOptions}
              value={field.value ?? undefined}
              onValueChange={(value) => field.onChange(value)}
              placeholder="選択してください"
              className="w-full"
              disabled={disabled}
            />
          )}
        />
        {genderError && <p className="text-sm text-red-500">{genderError}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">ランニングのペース</label>
        <Controller
          control={control}
          name="pace"
          render={({ field }) => (
            <PaceSelect
              value={field.value ?? undefined}
              onChangeValue={field.onChange}
              placeholder="選択してください"
              disabled={disabled}
            />
          )}
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
    </>
  );
};
