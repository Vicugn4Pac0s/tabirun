import { useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  routeUpdateDetailsSchema,
  type RouteUpdateDetailsInput,
} from "~/shared/schemas";
import type { RouterOutputs } from "~/trpc/react";
import { useUpdateRouteDetails } from "../api/useUpdateRouteDetails";
import { useCompleteRoute } from "../api/useCompleteRoute";

type RouteDetails = Pick<
  RouterOutputs["route"]["getById"],
  "id" | "title" | "status"
>;

/** 名前の保存・下書きの完了を行う。地図へ進む場合も先に名前を保存し、失敗時は入力を保つ。 */
export function useRouteDetails(route: RouteDetails) {
  const router = useRouter();
  const { updateDetails, isUpdating } = useUpdateRouteDetails();
  const { completeRoute, isCompleting } = useCompleteRoute();
  const form = useForm<RouteUpdateDetailsInput>({
    resolver: zodResolver(routeUpdateDetailsSchema),
    defaultValues: { id: route.id, title: route.title },
    mode: "onChange",
  });
  const submitting = useRef(false);
  const { isDirty, isValid, isSubmitting } = form.formState;
  const isSaving = isUpdating || isCompleting || isSubmitting;

  useEffect(() => {
    if (!isDirty) return;
    const beforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [isDirty]);

  const submit = (destination: "view" | "map") => {
    const handleSubmit = form.handleSubmit(async (values) => {
      try {
        if (form.formState.isDirty) {
          await updateDetails(values);
          form.reset(values);
        }
        if (destination === "view" && route.status === "draft") {
          await completeRoute({ id: route.id });
        }
      } catch {
        toast.error(
          "ルートを保存できませんでした。時間をおいて再度お試しください。",
        );
        return;
      }
      toast.success("ルートを保存しました。");
      router.push(`/routes/${route.id}${destination === "map" ? "/edit" : ""}`);
      router.refresh();
    });
    const guardedSubmit: typeof handleSubmit = (event) => {
      if (submitting.current || isSaving) {
        event?.preventDefault();
        return Promise.resolve();
      }
      submitting.current = true;
      return handleSubmit(event).finally(() => {
        submitting.current = false;
      });
    };
    return guardedSubmit;
  };

  const confirmNavigation = () =>
    !submitting.current &&
    !isSaving &&
    (!form.formState.isDirty ||
      window.confirm("未保存の変更があります。破棄して移動しますか？"));

  return {
    form,
    save: submit("view"),
    editMap: submit("map"),
    isSaving,
    canSave: isValid && (route.status === "draft" || isDirty),
    confirmNavigation,
  };
}
