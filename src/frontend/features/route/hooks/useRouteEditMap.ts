import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RouterOutputs } from "~/trpc/react";
import { useUpdateRoutePoints } from "../api/useUpdateRoutePoints";
import { useRoutePointsForm } from "./useRoutePointsForm";

/**
 * 既存ルートの編集状態と二重送信を防ぐ保存操作を返す。
 * 更新結果をtoastで通知し、下書きは詳細入力、完了済みは閲覧へ移動して表示を更新する。
 */
export function useRouteEditMap(
  route: Pick<RouterOutputs["route"]["getById"], "id" | "points" | "status">,
) {
  const router = useRouter();
  const { updatePoints, isUpdating } = useUpdateRoutePoints();
  const pointsForm = useRoutePointsForm(route);
  const submitting = useRef(false);
  const submit = pointsForm.form.handleSubmit(async (values) => {
    if (!pointsForm.isDirty) return;
    try {
      await updatePoints({
        id: route.id,
        ...values,
      });
    } catch {
      toast.error(
        "ルートを更新できませんでした。時間をおいて再度お試しください。",
      );
      return;
    }
    toast.success("ルートを更新しました。");
    pointsForm.form.reset(values);
    router.push(
      `/routes/${route.id}${route.status === "draft" ? "/details" : ""}`,
    );
    router.refresh();
  });
  const save: typeof submit = (event) => {
    if (submitting.current || isUpdating) {
      event?.preventDefault();
      return Promise.resolve();
    }
    submitting.current = true;
    return submit(event).finally(() => {
      submitting.current = false;
    });
  };

  return { pointsForm, isUpdating, save };
}
