import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RouteUpdateInput } from "~/shared/schemas";
import { useUpdateRoute } from "../api/useUpdateRoute";
import { useRouteDraft } from "./useRouteDraft";

type EditableRoute = Omit<RouteUpdateInput, "title"> & { title: string | null };

export function useRouteEdit(route: EditableRoute) {
  const router = useRouter();
  const { updateRoute, isUpdating } = useUpdateRoute();
  const draft = useRouteDraft(route, isUpdating);
  const submitting = useRef(false);
  const save = async () => {
    if (!draft.canSave || isUpdating || submitting.current) return;
    submitting.current = true;
    try {
      await updateRoute({
        id: route.id,
        title: draft.title.trim(),
        points: draft.points,
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
  };

  return { ...draft, isUpdating, save };
}
