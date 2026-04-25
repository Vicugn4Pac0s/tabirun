"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "~/frontend/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/frontend/components/ui/dialog";
import { Input } from "~/frontend/components/ui/input";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";
import { usePacesQuery } from "~/frontend/features/pace/hooks/usePacesQuery";
import { useUpdateUser } from "~/frontend/features/user/hooks/useUpdateUser";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";
import {
  type UserProfileUpdateInput,
  userProfileUpdateSchema,
} from "~/shared/schemas";

type UserProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const genderOptions = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
  { value: "other", label: "その他" },
  { value: "prefer_not_to_say", label: "回答しない" },
];

export const UserProfileDialog = ({
  open,
  onOpenChange,
}: UserProfileDialogProps) => {
  const { user, isLoading } = useUserQuery();
  const { paces } = usePacesQuery();
  const { updateUser, isUpdating } = useUpdateUser();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserProfileUpdateInput>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {
      birthDate: undefined,
      gender: undefined,
      pace: undefined,
      height: undefined,
      weight: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      birthDate: user?.birthDate ?? undefined,
      gender: user?.gender ?? undefined,
      pace: user?.pace ?? undefined,
      height: user?.height ?? undefined,
      weight: user?.weight ?? undefined,
    });
  }, [open, reset, user]);

  const paceOptions = paces.map((pace) => ({
    value: pace.value,
    label: pace.value,
  }));

  const submitProfile = async (data: UserProfileUpdateInput) => {
    await updateUser(data, {
      onSuccess: () => {
        toast.success("プロフィールを更新しました");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("プロフィールの更新に失敗しました");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プロフィールを編集</DialogTitle>
          <DialogDescription>
            任意のプロフィール情報を更新できます。
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(submitProfile)}>
          <div className="space-y-1">
            <label className="text-sm font-medium">生年月日</label>
            <Input
              type="date"
              disabled={isLoading || isUpdating}
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
                disabled={isLoading || isUpdating}
                {...register("height", {
                  setValueAs: (value: string) =>
                    value === "" ? undefined : Number.parseInt(value, 10),
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
                disabled={isLoading || isUpdating}
                {...register("weight", {
                  setValueAs: (value: string) =>
                    value === "" ? undefined : Number.parseInt(value, 10),
                })}
              />
              {errors.weight && (
                <p className="text-sm text-red-500">{errors.weight.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || isUpdating}>
              {isUpdating ? "更新中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
