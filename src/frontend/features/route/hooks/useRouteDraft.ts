import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormState, useWatch } from "react-hook-form";
import { routeCreateSchema, type RouteCreateInput } from "~/shared/schemas";

export function useRouteDraft(route: RouteCreateInput, isSaving: boolean) {
  const [initial] = useState(() => ({
    title: route.title,
    points: route.points.map((point) => ({ ...point })),
  }));
  const form = useForm<RouteCreateInput>({
    resolver: zodResolver(routeCreateSchema),
    defaultValues: initial,
    mode: "onChange",
  });
  const points = useWatch({ control: form.control, name: "points" });
  const { isDirty, isValid } = useFormState({ control: form.control });
  const canSave = isDirty && isValid;

  const togglePoint = (point: google.maps.LatLngLiteral) => {
    const current = form.getValues("points");
    const exists = current.some(
      (item) => item.lat === point.lat && item.lng === point.lng,
    );
    const next = exists
      ? current.filter(
          (item) => item.lat !== point.lat || item.lng !== point.lng,
        )
      : [...current, { ...point }];
    form.setValue("points", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const reset = () => {
    if (isSaving || !isDirty) return;
    if (window.confirm("編集中の変更を破棄してリセットしますか？")) {
      form.reset(initial);
    }
  };
  const confirmDiscard = () =>
    !isDirty ||
    window.confirm("未保存の変更があります。破棄して移動しますか？");
  useEffect(() => {
    if (!isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  return {
    form,
    points,
    isDirty,
    canSave,
    togglePoint,
    reset,
    confirmDiscard,
  };
}
