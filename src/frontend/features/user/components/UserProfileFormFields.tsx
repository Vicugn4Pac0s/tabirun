"use client";

import { MapPinned } from "lucide-react";
import { Controller, type Control, type FieldErrors, type FieldError, type UseFormRegister } from "react-hook-form";

import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";

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

export type UserProfileFormValues = {
  birthDate?: string;
  gender?: string;
  pace?: string;
  height?: number;
  weight?: number;
  homeLat?: number | null;
  homeLng?: number | null;
};

type UserProfileFormFieldsProps = {
  register: UseFormRegister<UserProfileFormValues>;
  control: Control<UserProfileFormValues>;
  errors: FieldErrors<UserProfileFormValues>;
  disabled: boolean;
  showHomeLocationFields?: boolean;
  canUseCurrentMapCenter?: boolean;
  onUseCurrentMapCenter?: () => void;
};

const toOptionalString = (value: string) => (value === "" ? undefined : value);

const toOptionalInt = (value: string) =>
  value === "" ? undefined : Number.parseInt(value, 10);

const toNullableFloat = (value: string) =>
  value === "" ? null : Number.parseFloat(value);

const getErrorMessage = (error: FieldError | undefined) => error?.message;

export const UserProfileFormFields = ({
  register,
  control,
  errors,
  disabled,
  showHomeLocationFields = false,
  canUseCurrentMapCenter = false,
  onUseCurrentMapCenter,
}: UserProfileFormFieldsProps) => {
  const birthDateError = getErrorMessage(errors.birthDate);
  const genderError = getErrorMessage(errors.gender);
  const paceError = getErrorMessage(errors.pace);
  const heightError = getErrorMessage(errors.height);
  const weightError = getErrorMessage(errors.weight);
  const homeLatError = getErrorMessage(errors.homeLat);
  const homeLngError = getErrorMessage(errors.homeLng);

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

      {showHomeLocationFields ? (
        <div className="space-y-3 rounded-lg border border-base-gray-light bg-white/70 p-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">地図の初期位置</p>
              <p className="text-xs leading-relaxed text-base-gray">
                現在表示中の地図中心をホーム地点として保存できます。
              </p>
            </div>
            {onUseCurrentMapCenter ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                disabled={disabled || !canUseCurrentMapCenter}
                onClick={onUseCurrentMapCenter}
              >
                <MapPinned />
                現在の地図位置を使う
              </Button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">緯度</label>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                disabled={disabled}
                {...register("homeLat", {
                  setValueAs: toNullableFloat,
                })}
              />
              {homeLatError && <p className="text-sm text-red-500">{homeLatError}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">経度</label>
              <Input
                type="number"
                inputMode="decimal"
                step="any"
                disabled={disabled}
                {...register("homeLng", {
                  setValueAs: toNullableFloat,
                })}
              />
              {homeLngError && <p className="text-sm text-red-500">{homeLngError}</p>}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};
