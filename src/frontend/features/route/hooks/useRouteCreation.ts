import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateRoute } from "../api/useCreateRoute";
import { useRouteDraft } from "./useRouteDraft";

/**
 * 新規ルートの編集状態と二重送信を防ぐ保存操作を返す。
 * 保存結果をtoastで通知し、成功時はホームへ移動してサーバー表示を更新する。
 */
export function useRouteCreation() {
  const router = useRouter();
  const { createRoute, isCreating } = useCreateRoute();
  const draft = useRouteDraft({ title: "", points: [] });
  const submitting = useRef(false);
  const submit = draft.form.handleSubmit(async (values) => {
    if (!draft.isDirty) return;
    try {
      await createRoute(values);
    } catch {
      toast.error(
        "ルートを保存できませんでした。時間をおいて再度お試しください。",
      );
      return;
    }
    toast.success("ルートを保存しました。");
    router.push("/");
    router.refresh();
  });
  const save: typeof submit = (event) => {
    if (submitting.current || isCreating) {
      event?.preventDefault();
      return Promise.resolve();
    }
    submitting.current = true;
    return submit(event).finally(() => {
      submitting.current = false;
    });
  };
  return { draft, isCreating, save };
}
