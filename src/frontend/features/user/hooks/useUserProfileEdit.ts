import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useUpdateUserProfile } from "~/frontend/features/user/api/useUpdateUserProfile";
import {
  userProfileUpdateSchema,
  type UserProfileUpdateInput,
} from "~/shared/schemas";

export function useUserProfileEdit(initialValues: UserProfileUpdateInput) {
  const router = useRouter();
  const { updateUserProfile, isUpdating } = useUpdateUserProfile();
  const form = useForm<UserProfileUpdateInput>({
    resolver: zodResolver(userProfileUpdateSchema),
    defaultValues: initialValues,
  });
  const save = form.handleSubmit(async (data) => {
    try {
      await updateUserProfile(data);
    } catch {
      toast.error(
        "プロフィールを更新できませんでした。時間をおいて再度お試しください。",
      );
      return;
    }
    toast.success("プロフィールを更新しました。");
    router.push("/");
    router.refresh();
  });
  return { form, save, isUpdating: isUpdating || form.formState.isSubmitting };
}
