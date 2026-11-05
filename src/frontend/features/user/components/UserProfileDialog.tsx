"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import {
  type UserProfileFormValues,
  UserProfileFormFields,
} from "~/frontend/features/user/components/UserProfileFormFields";
import { useUpdateUserProfile } from "~/frontend/features/user/api/useUpdateUserProfile";
import { useCurrentUserQuery } from "~/frontend/features/user/api/useCurrentUserQuery";
import { userProfileUpdateSchema } from "~/shared/schemas";

type UserProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UserProfileDialog = ({
  open,
  onOpenChange,
}: UserProfileDialogProps) => {
  const { user, isLoading, error } = useCurrentUserQuery();
  const { updateUserProfile, isUpdating } = useUpdateUserProfile();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserProfileFormValues>({
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

  useEffect(() => {
    if (!open || !error) return;
    toast.error(
      "プロフィール情報を取得できませんでした。時間をおいて再度お試しください。",
    );
  }, [error, open]);

  const submitProfile = async (data: UserProfileFormValues) => {
    try {
      const parsedData = userProfileUpdateSchema.parse(data);
      await updateUserProfile(parsedData);
      toast.success("プロフィールを更新しました。");
      onOpenChange(false);
    } catch {
      toast.error(
        "プロフィールを更新できませんでした。時間をおいて再度お試しください。",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <DialogHeader>
          <DialogTitle>プロフィールを編集</DialogTitle>
          <DialogDescription>
            任意のプロフィール情報を更新できます。
          </DialogDescription>
        </DialogHeader>

        <form
          className="flex min-h-0 flex-col gap-4"
          onSubmit={handleSubmit(submitProfile)}
        >
          <div className="min-h-0 overflow-y-auto pr-1">
            <UserProfileFormFields
              register={register}
              control={control}
              errors={errors}
              disabled={isLoading || isUpdating}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading || isUpdating || !!error}>
              {isUpdating ? "更新中..." : "保存する"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
