import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { RouteUpdateInput } from "~/shared/schemas";
import { useUpdateRoute } from "./useUpdateRoute";

type EditableRoute = Omit<RouteUpdateInput, "title"> & { title: string | null };

export function useRouteEdit(route: EditableRoute) {
  const router = useRouter();
  const { updateRoute, isUpdating } = useUpdateRoute();
  const submitting = useRef(false);
  const [initial] = useState(() => ({
    title: route.title ?? "",
    points: route.points.map((point) => ({ ...point })),
  }));
  const [draft, setDraft] = useState(initial);
  const { title, points } = draft;
  const isDirty =
    title !== initial.title ||
    points.length !== initial.points.length ||
    points.some(
      (point, index) =>
        point.lat !== initial.points[index]?.lat ||
        point.lng !== initial.points[index]?.lng,
    );
  const canSave = isDirty && title.trim().length > 0 && points.length >= 2;

  const setTitle = (title: string) => {
    setDraft((previous) => ({ ...previous, title }));
  };
  const togglePoint = (point: google.maps.LatLngLiteral) => {
    setDraft((previous) => {
      const exists = previous.points.some(
        (item) => item.lat === point.lat && item.lng === point.lng,
      );
      const points = exists
        ? previous.points.filter(
            (item) => item.lat !== point.lat || item.lng !== point.lng,
          )
        : [...previous.points, { ...point }];
      return { ...previous, points };
    });
  };

  const save = async () => {
    if (!canSave || isUpdating || submitting.current) return;
    submitting.current = true;
    try {
      await updateRoute({ id: route.id, title: title.trim(), points });
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

  const reset = () => {
    if (isUpdating || !isDirty) return;
    if (window.confirm("編集中の変更を破棄してリセットしますか？"))
      setDraft(initial);
  };
  const confirmDiscard = () =>
    !isDirty ||
    window.confirm("未保存の変更があります。破棄して移動しますか？");

  useEffect(() => {
    if (!isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  return {
    title,
    points,
    isDirty,
    canSave,
    isUpdating,
    setTitle,
    togglePoint,
    save,
    reset,
    confirmDiscard,
  };
}
