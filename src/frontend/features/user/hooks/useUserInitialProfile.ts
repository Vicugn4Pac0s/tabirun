import { useRef } from "react";
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

/**
 * 初期プロフィールの検証付きフォームと、二重送信を防ぐ保存操作を返す。
 * 保存結果をtoastで通知し、成功時は現在の画面を再取得する。
 */
export function useUserInitialProfile(initialValues: UserProfileUpdateInput) {
  const router = useRouter();
  const { completeInitialProfile, isCompleting } = useCompleteInitialProfile();

  const form = useForm<UserInitialProfileInput>({
    resolver: zodResolver(userInitialProfileSchema),
    defaultValues: initialValues,
  });

  const submitting = useRef(false);
  const submit = form.handleSubmit(async (values) => {
    try {
      await completeInitialProfile(values);
    } catch {
      toast.error(
        "初期設定を保存できませんでした。時間をおいて再度お試しください。",
      );
      return;
    }
    toast.success("初期設定を保存しました。");
    router.refresh();
  });
  const save: typeof submit = (event) => {
    if (submitting.current || isCompleting) {
      event?.preventDefault();
      return Promise.resolve();
    }
    submitting.current = true;
    return submit(event).finally(() => {
      submitting.current = false;
    });
  };

  return {
    form,
    save,
    isCompleting: isCompleting || form.formState.isSubmitting,
  };
}
