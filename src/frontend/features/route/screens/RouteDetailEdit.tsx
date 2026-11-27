"use client";

import type { RouterOutputs } from "~/trpc/react";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import { WarningBanner } from "~/frontend/components/app-ui/WarningBanner";
import { FormField } from "~/frontend/components/app-ui/FormField";
import { PrimaryButton } from "~/frontend/components/app-ui/PrimaryButton";
import { Button } from "~/frontend/components/ui/button";
import { Input } from "~/frontend/components/ui/input";
import { getRouteCalculationWarningMessage } from "../lib/getRouteCalculationWarningMessage";
import { useRouteDetailEditForm } from "../hooks/useRouteDetailEditForm";

type RouteDetailEditProps = {
  route: Pick<
    RouterOutputs["route"]["getById"],
    "id" | "title" | "status" | "direction" | "directionErrorCode"
  >;
};

/** ルート名の入力を表示する。下書きは完了、完了済みは名前だけを保存する。 */
export function RouteDetailEdit({ route }: RouteDetailEditProps) {
  const { form, save, editMap, isSaving, canSave, confirmNavigation } =
    useRouteDetailEditForm(route);
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
      <section className="space-y-6">
        <GuardedLink
          href={route.status === "draft" ? "/" : `/routes/${route.id}`}
          className="inline-block font-medium underline"
          aria-disabled={isSaving}
        >
          {route.status === "draft" ? "ホームへ戻る" : "ルートに戻る"}
        </GuardedLink>
        <h1 className="text-2xl font-semibold">ルートの詳細を入力</h1>
        {warning && <WarningBanner>{warning}</WarningBanner>}
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
            <PrimaryButton
              type="submit"
              className="text-sm font-medium"
              disabled={isSaving || !canSave}
            >
              {isSaving
                ? "保存中..."
                : route.status === "draft"
                  ? "完了"
                  : "保存"}
            </PrimaryButton>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-lg shadow-none"
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
