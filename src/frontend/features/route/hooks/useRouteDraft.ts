import { useEffect, useState } from "react";

type InitialRoute = {
  title: string | null;
  points: google.maps.LatLngLiteral[];
};

export function useRouteDraft(route: InitialRoute, isSaving: boolean) {
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

  const reset = () => {
    if (isSaving || !isDirty) return;
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
    setTitle,
    togglePoint,
    reset,
    confirmDiscard,
  };
}
