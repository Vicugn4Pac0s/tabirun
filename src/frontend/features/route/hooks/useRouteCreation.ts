import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateRoute } from "../api/useCreateRoute";
import { useRouteDraft } from "./useRouteDraft";

export function useRouteCreation() {
  const router = useRouter();
  const { createRoute, isCreating } = useCreateRoute();
  const draft = useRouteDraft({ title: "", points: [] }, isCreating);
  const submitting = useRef(false);
  const save = async () => {
    if (!draft.canSave || isCreating || submitting.current) return;
    submitting.current = true;
    try {
      await createRoute({ title: draft.title.trim(), points: draft.points });
      toast.success("ルートを保存しました。");
      router.push("/");
      router.refresh();
    } catch {
      toast.error(
        "ルートを保存できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      submitting.current = false;
    }
  };
  return { ...draft, isCreating, save };
}
