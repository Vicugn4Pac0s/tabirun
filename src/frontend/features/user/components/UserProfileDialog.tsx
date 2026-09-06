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
import { useCurrentStreetViewPosition } from "~/frontend/features/googlemap/hooks/useCurrentStreetViewPosition";
import { useUpdateUser } from "~/frontend/features/user/hooks/useUpdateUser";
import { useUserQuery } from "~/frontend/features/user/hooks/useUserQuery";
import { userProfileUpdateSchema } from "~/shared/schemas";

type UserProfileDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const UserProfileDialog = ({
  open,
  onOpenChange,
}: UserProfileDialogProps) => {
  const { user, isLoading, error } = useUserQuery();
  const { updateUser, isUpdating } = useUpdateUser();
  const {
    canReadCurrentStreetViewPosition,
    getCurrentStreetViewPosition,
  } = useCurrentStreetViewPosition();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UserProfileFormValues>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: {
      birthDate: undefined,
      gender: undefined,
      pace: undefined,
      height: undefined,
      weight: undefined,
      homeLat: undefined,
      homeLng: undefined,
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
      homeLat: user?.homeLat ?? null,
      homeLng: user?.homeLng ?? null,
    });
  }, [open, reset, user]);

  useEffect(() => {
    if (!open || !error) return;
    toast.error("プロフィール情報を取得できませんでした。時間をおいて再度お試しください。");
  }, [error, open]);

  const submitProfile = async (data: UserProfileFormValues) => {
    const parsedData = userProfileUpdateSchema.parse(data);

    await updateUser(parsedData, {
      onSuccess: () => {
        toast.success("プロフィールを更新しました");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("プロフィールを更新できませんでした。時間をおいて再度お試しください。");
      },
    });
  };

  const applyCurrentStreetViewPosition = () => {
    const position = getCurrentStreetViewPosition();

    if (!position) {
      toast.error("現在表示中のマーカー位置を取得できませんでした。");
      return;
    }

    setValue("homeLat", Number(position.lat.toFixed(6)), {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("homeLng", Number(position.lng.toFixed(6)), {
      shouldDirty: true,
      shouldValidate: true,
    });
    toast.success("現在表示中のマーカー位置をホーム地点に設定しました");
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
              showHomeLocationFields
              canUseCurrentStreetViewPosition={
                canReadCurrentStreetViewPosition
              }
              onUseCurrentStreetViewPosition={applyCurrentStreetViewPosition}
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
