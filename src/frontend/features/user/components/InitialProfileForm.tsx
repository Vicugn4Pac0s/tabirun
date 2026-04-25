"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import { usePacesQuery } from "~/frontend/features/pace/hooks/usePacesQuery";
import { useUpdateUser } from "~/frontend/features/user/hooks/useUpdateUser";
import {
  type UserInitialProfileInput,
  userInitialProfileSchema,
} from "~/shared/schemas";

type InitialProfileFormProps = {
  initialValues: {
    birthDate?: string;
    gender?: string;
    pace?: string;
    height?: number;
    weight?: number;
  };
};

const genderOptions = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
];

export const InitialProfileForm = ({ initialValues }: InitialProfileFormProps) => {
  const router = useRouter();
  const { paces } = usePacesQuery();
  const { updateUser, isUpdating } = useUpdateUser();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserInitialProfileInput>({
    resolver: zodResolver(userInitialProfileSchema),
    defaultValues: {
      birthDate: initialValues.birthDate,
      gender: initialValues.gender,
      pace: initialValues.pace,
      height: initialValues.height,
      weight: initialValues.weight,
    },
  });

  const paceOptions = paces.map((pace) => ({
    value: pace.value,
    label: pace.value,
  }));

  const submitProfile = async (data: UserInitialProfileInput) => {
    await updateUser(data, {
      onSuccess: () => {
        toast.success("初期設定を保存しました");
        router.replace("/");
      },
      onError: () => {
        toast.error("初期設定の保存に失敗しました");
      },
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitProfile)}>
      <div className="space-y-1">
        <label className="text-sm font-medium">生年月日</label>
        <Input
          type="date"
          disabled={isUpdating}
          {...register("birthDate")}
        />
        {errors.birthDate && (
          <p className="text-sm text-red-500">{errors.birthDate.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">性別</label>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Selectbox
              items={genderOptions}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              placeholder="選択してください"
              className="w-full"
            />
          )}
        />
        {errors.gender && (
          <p className="text-sm text-red-500">{errors.gender.message}</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">ランニングのペース</label>
        <Controller
          control={control}
          name="pace"
          render={({ field }) => (
            <Selectbox
              items={paceOptions}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
              placeholder="選択してください"
              className="w-full"
            />
          )}
        />
        {errors.pace && (
          <p className="text-sm text-red-500">{errors.pace.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-medium">身長(cm)</label>
          <Input
            type="number"
            inputMode="numeric"
            disabled={isUpdating}
            {...register("height", {
              setValueAs: (value: string) => Number.parseInt(value, 10),
            })}
          />
          {errors.height && (
            <p className="text-sm text-red-500">{errors.height.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium">体重(kg)</label>
          <Input
            type="number"
            inputMode="numeric"
            disabled={isUpdating}
            {...register("weight", {
              setValueAs: (value: string) => Number.parseInt(value, 10),
            })}
          />
          {errors.weight && (
            <p className="text-sm text-red-500">{errors.weight.message}</p>
          )}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isUpdating}>
        {isUpdating ? "保存中..." : "初期設定を完了"}
      </Button>
    </form>
  );
};
