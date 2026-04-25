"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/frontend/components/ui/button";
import {
  type UserProfileFormValues,
  UserProfileFormFields,
} from "~/frontend/features/user/components/UserProfileFormFields";
import { useCompleteInitialProfile } from "~/frontend/features/user/hooks/useCompleteInitialProfile";
import {
  userInitialProfileSchema,
} from "~/shared/schemas";

type InitialProfileFormProps = {
  initialValues: UserProfileFormValues;
};

export const InitialProfileForm = ({ initialValues }: InitialProfileFormProps) => {
  const router = useRouter();
  const { completeInitialProfile, isCompleting } = useCompleteInitialProfile();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserProfileFormValues>({
    resolver: zodResolver(userInitialProfileSchema),
    defaultValues: {
      birthDate: initialValues.birthDate,
      gender: initialValues.gender,
      pace: initialValues.pace,
      height: initialValues.height,
      weight: initialValues.weight,
    },
  });

  const submitProfile = async (data: UserProfileFormValues) => {
    const parsedData = userInitialProfileSchema.parse(data);

    await completeInitialProfile(parsedData, {
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
      <UserProfileFormFields
        register={register}
        control={control}
        errors={errors}
        disabled={isCompleting}
      />

      <Button type="submit" className="w-full" disabled={isCompleting}>
        {isCompleting ? "保存中..." : "初期設定を完了"}
      </Button>
    </form>
  );
};
