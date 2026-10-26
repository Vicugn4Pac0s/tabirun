import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { routeCreateSchema, type RouteCreateInput } from "~/shared/schemas";

const routeFormSchema = routeCreateSchema.pick({ title: true });

export type RouteFormValues = Pick<RouteCreateInput, "title">;

type InitialRoute = {
  title: string | null;
  points: google.maps.LatLngLiteral[];
};

export function useRouteDraft(route: InitialRoute, isSaving: boolean) {
  const [initial] = useState(() => ({
    title: route.title ?? "",
    points: route.points.map((point) => ({ ...point })),
  }));
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
    defaultValues: { title: initial.title },
    mode: "onChange",
  });
  const { trigger } = form;
  useEffect(() => {
    void trigger("title");
  }, [trigger]);

  const [points, setPoints] = useState(initial.points);
  const pointsDirty =
    points.length !== initial.points.length ||
    points.some(
      (point, index) =>
        point.lat !== initial.points[index]?.lat ||
        point.lng !== initial.points[index]?.lng,
    );
  const isDirty = form.formState.isDirty || pointsDirty;
  const canSave = isDirty && form.formState.isValid && points.length >= 2;
  const canSubmit = () =>
    isDirty &&
    routeFormSchema.safeParse(form.getValues()).success &&
    points.length >= 2;

  const togglePoint = (point: google.maps.LatLngLiteral) => {
    setPoints((previous) => {
      const exists = previous.some(
        (item) => item.lat === point.lat && item.lng === point.lng,
      );
      return exists
        ? previous.filter(
            (item) => item.lat !== point.lat || item.lng !== point.lng,
          )
        : [...previous, { ...point }];
    });
  };

  const reset = () => {
    if (isSaving || !isDirty) return;
    if (window.confirm("編集中の変更を破棄してリセットしますか？")) {
      form.reset({ title: initial.title });
      setPoints(initial.points.map((point) => ({ ...point })));
      void trigger("title");
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
    canSubmit,
    togglePoint,
    reset,
    confirmDiscard,
  };
}
