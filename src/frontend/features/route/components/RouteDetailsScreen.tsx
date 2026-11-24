"use client";

import type { RouterOutputs } from "~/trpc/react";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { useRouteDetails } from "../hooks/useRouteDetails";
import { RouteDetailsForm } from "./RouteDetailsForm";

type RouteDetailsScreenProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "title" | "status" | "direction" | "directionErrorCode"
  >;
};

/** 保存済みの距離と名前入力を表示する。下書きは完了、完了済みは名前だけを保存する。 */
export function RouteDetailsScreen({ route }: RouteDetailsScreenProps) {
  const { form, save, editMap, isSaving, canSave, confirmNavigation } =
    useRouteDetails(route);
  const { pace, setPace, weightKg } = useRunEstimateInputs();
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
          href={
            route.status === "draft" ? "/routes/new" : `/routes/${route.id}`
          }
          className="inline-block font-medium underline"
          aria-disabled={isSaving}
        >
          {route.status === "draft" ? "ルート作成に戻る" : "ルートに戻る"}
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
        <RouteDetailsForm
          form={form}
          onSubmit={save}
          onEditMap={editMap}
          isSaving={isSaving}
          canSave={canSave}
          submitLabel={route.status === "draft" ? "完了" : "保存"}
        />
      </section>
    </NavigationGuardProvider>
  );
}
