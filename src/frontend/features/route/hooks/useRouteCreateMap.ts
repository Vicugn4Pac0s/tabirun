import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateRouteDraft } from "../api/useCreateRouteDraft";
import { useRoutePointsForm } from "./useRoutePointsForm";

/**
 * 新規ルートの編集状態と二重送信を防ぐ保存操作を返す。
 * 保存結果をtoastで通知し、成功時は詳細入力へ履歴を置き換えて移動し、サーバー表示を更新する。
 * 作成ページは履歴に残さない。
 */
export function useRouteCreateMap() {
  const router = useRouter();
  const { createDraft, isCreating } = useCreateRouteDraft();
  const draft = useRoutePointsForm({ points: [] });
  const submitting = useRef(false);
  const submit = draft.form.handleSubmit(async (values) => {
    if (!draft.isDirty) return;
    let id: number;
    try {
      const created = await createDraft(values);
      id = created.id;
    } catch {
      toast.error(
        "ルートを保存できませんでした。時間をおいて再度お試しください。",
      );
      return;
    }
    draft.form.reset(values);
    toast.success("ルートを保存しました。");
    router.replace(`/routes/${id}/details`);
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
