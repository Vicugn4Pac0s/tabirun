import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDeleteRoute } from "../api/useDeleteRoute";

export function useRouteDeletion(routeId: number) {
  const router = useRouter();
  const { deleteRoute, isDeleting } = useDeleteRoute();
  const deleting = useRef(false);

  const remove = async () => {
    if (
      isDeleting ||
      deleting.current ||
      !window.confirm("このルートを削除しますか？")
    ) {
      return;
    }

    deleting.current = true;
    try {
      await deleteRoute({ id: routeId });
      toast.success("ルートを削除しました。");
      router.replace("/");
      router.refresh();
    } catch {
      toast.error(
        "ルートを削除できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      deleting.current = false;
    }
  };

  return { remove, isDeleting };
}
