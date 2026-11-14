import { useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDeleteRoute } from "../api/useDeleteRoute";

/**
 * 確認ダイアログ付きの削除操作と状態を返し、実行中の重複削除を防ぐ。
 * 結果をtoastで通知し、成功時はホームへ置き換えてサーバー表示を更新する。
 */
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
