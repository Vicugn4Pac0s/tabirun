import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useCompleteInitialProfile } from "~/frontend/features/user/api/useCompleteInitialProfile";
import {
  userInitialProfileSchema,
  type UserInitialProfileInput,
  type UserProfileUpdateInput,
} from "~/shared/schemas";

export function useUserInitialProfile(initialValues: UserProfileUpdateInput) {
  const router = useRouter();
  const { completeInitialProfile, isCompleting } = useCompleteInitialProfile();

  const form = useForm<UserInitialProfileInput>({
    resolver: zodResolver(userInitialProfileSchema),
    defaultValues: initialValues,
  });

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

  return { form, save: form.handleSubmit(submitProfile), isCompleting };
}
