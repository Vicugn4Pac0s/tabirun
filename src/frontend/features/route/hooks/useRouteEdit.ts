import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RouteUpdateInput } from "~/shared/schemas";
import { useUpdateRoute } from "../api/useUpdateRoute";
import { useRouteDraft } from "./useRouteDraft";

export function useRouteEdit(route: RouteUpdateInput) {
  const router = useRouter();
  const { updateRoute, isUpdating } = useUpdateRoute();
  const draft = useRouteDraft(route, isUpdating);
  const submitting = useRef(false);
  const save = draft.form.handleSubmit(async (values) => {
    if (!draft.isDirty || isUpdating || submitting.current) return;
    submitting.current = true;
    try {
      await updateRoute({
        id: route.id,
        ...values,
      });
      toast.success("ルートを更新しました。");
      router.push(`/routes/${route.id}`);
      router.refresh();
    } catch {
      toast.error(
        "ルートを更新できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      submitting.current = false;
    }
  });

  return { ...draft, isUpdating, save };
}
