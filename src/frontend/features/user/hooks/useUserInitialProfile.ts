import { parseReturnTo } from "~/shared/schemas/auth";
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

export function useUserInitialProfile(
  initialValues: UserProfileUpdateInput,
  returnTo?: string,
) {
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
    router.replace(parseReturnTo(returnTo));
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
