"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useController, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/frontend/components/ui/button";
import {
  type UserProfileFormValues,
  UserProfileFormFields,
} from "~/frontend/features/user/components/UserProfileFormFields";
import { useCompleteInitialProfile } from "~/frontend/features/user/api/useCompleteInitialProfile";
import {
  userInitialProfileSchema,
  type UserInitialProfileInput,
} from "~/shared/schemas";

type InitialProfileFormProps = {
  initialValues: UserProfileFormValues;
};

export const InitialProfileForm = ({
  initialValues,
}: InitialProfileFormProps) => {
  const router = useRouter();
  const { completeInitialProfile, isCompleting } = useCompleteInitialProfile();

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

  const { field: gender } = useController({ control, name: "gender" });
  const { field: pace } = useController({ control, name: "pace" });

  const submitProfile = async (data: UserInitialProfileInput) => {
    try {
      await completeInitialProfile(data);
    } catch {
      toast.error(
        "初期設定を保存できませんでした。時間をおいて再度お試しください。",
      );
      return;
    }
    toast.success("初期設定を保存しました。");
    router.replace("/");
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(submitProfile)}>
      <UserProfileFormFields
        register={register}
        gender={gender}
        pace={pace}
        errors={errors}
        disabled={isCompleting}
      />

      <Button type="submit" className="w-full" disabled={isCompleting}>
        {isCompleting ? "保存中..." : "初期設定を完了"}
      </Button>
    </form>
  );
};
