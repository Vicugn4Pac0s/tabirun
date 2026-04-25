"use client";

import { Controller, type Control, type FieldErrors, type FieldValues, type Path, type UseFormRegister } from "react-hook-form";

import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import { Input } from "~/frontend/components/ui/input";

type SelectOption = {
  value: string;
  label: string;
};

type UserProfileFormFieldValues = {
  birthDate?: string;
  gender?: string;
  pace?: string;
  height?: number;
  weight?: number;
};

type UserProfileFormFieldsProps<T extends FieldValues & UserProfileFormFieldValues> = {
  register: UseFormRegister<T>;
  control: Control<T>;
  errors: FieldErrors<T>;
  genderOptions: SelectOption[];
  paceOptions: SelectOption[];
  disabled: boolean;
};

const toOptionalString = (value: string) => (value === "" ? undefined : value);

const toOptionalInt = (value: string) =>
  value === "" ? undefined : Number.parseInt(value, 10);

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }

  return undefined;
};

export const UserProfileFormFields = <
  T extends FieldValues & UserProfileFormFieldValues,
>({
  register,
  control,
  errors,
  genderOptions,
  paceOptions,
  disabled,
}: UserProfileFormFieldsProps<T>) => {
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
          {...register("birthDate" as Path<T>, {
            setValueAs: toOptionalString,
          })}
        />
        {birthDateError && <p className="text-sm text-red-500">{birthDateError}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">性別</label>
        <Controller
          control={control}
          name={"gender" as Path<T>}
          render={({ field }) => (
            <Selectbox
              items={genderOptions}
              value={(field.value as string | undefined) ?? undefined}
              onValueChange={(value) => field.onChange(value)}
              placeholder="選択してください"
              className="w-full"
            />
          )}
        />
        {genderError && <p className="text-sm text-red-500">{genderError}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">ランニングのペース</label>
        <Controller
          control={control}
          name={"pace" as Path<T>}
          render={({ field }) => (
            <Selectbox
              items={paceOptions}
              value={(field.value as string | undefined) ?? undefined}
              onValueChange={(value) => field.onChange(value)}
              placeholder="選択してください"
              className="w-full"
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
            {...register("height" as Path<T>, {
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
            {...register("weight" as Path<T>, {
              setValueAs: toOptionalInt,
            })}
          />
          {weightError && <p className="text-sm text-red-500">{weightError}</p>}
        </div>
      </div>
    </>
  );
};
