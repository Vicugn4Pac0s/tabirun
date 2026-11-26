"use client";

import type { RouterOutputs } from "~/trpc/react";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { FormField } from "~/frontend/components/app-ui/FormField";
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { useRouteDetailEdit } from "../hooks/useRouteDetailEdit";

type RouteDetailEditProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "title" | "status" | "direction" | "directionErrorCode"
  >;
};

/** 保存済みの距離と名前入力を表示する。下書きは完了、完了済みは名前だけを保存する。 */
export function RouteDetailEdit({ route }: RouteDetailEditProps) {
  const { form, save, editMap, isSaving, canSave, confirmNavigation } =
    useRouteDetailEdit(route);
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const { errors, touchedFields, isSubmitted } = form.formState;
  const titleError =
    touchedFields.title || isSubmitted ? errors.title?.message : undefined;
  const warningCode =
    route.direction?.directionSource === "straight_line"
      ? "TOO_MANY_REQUESTS"
      : route.directionErrorCode;
  const warning = getRouteCalculationWarningMessage(
    warningCode ? { data: { code: warningCode } } : null,
    "saved",
  );
  return (
    <NavigationGuardProvider confirmNavigation={confirmNavigation}>
      <section className="mx-auto max-w-xl space-y-6 px-4 py-8 md:px-6">
        <GuardedLink
          href={route.status === "draft" ? "/" : `/routes/${route.id}`}
          className="inline-block font-medium underline"
          aria-disabled={isSaving}
        >
          {route.status === "draft" ? "ホームへ戻る" : "ルートに戻る"}
        </GuardedLink>
        <h1 className="text-2xl font-semibold">ルートの詳細を入力</h1>
        {warning && <WarningBanner>{warning}</WarningBanner>}
        <RunMetricsPanel
          distanceMeters={route.direction?.distanceMeters}
          isLoading={false}
          pace={pace}
          onPaceChange={setPace}
          weightKg={weightKg}
        />
        <form
          onSubmit={(event) => {
            void save(event);
          }}
          className="space-y-6"
        >
          <FormField label="ルート名" error={titleError}>
            {(fieldProps) => (
              <Input
                {...fieldProps}
                {...form.register("title")}
                disabled={isSaving}
              />
            )}
          </FormField>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={isSaving || !canSave}>
              {isSaving
                ? "保存中..."
                : route.status === "draft"
                  ? "完了"
                  : "保存"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                void editMap();
              }}
            >
              地図を編集
            </Button>
          </div>
        </form>
      </section>
    </NavigationGuardProvider>
  );
}
