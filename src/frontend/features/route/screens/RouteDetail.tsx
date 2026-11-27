"use client";

import Link from "next/link";
import { Button } from "~/frontend/components/ui/button";
import type { RouterOutputs } from "~/trpc/react";
import { RunMetricsPanel } from "~/frontend/features/run-metrics/components/RunMetricsPanel";
import { useRunEstimateInputs } from "~/frontend/features/run-metrics/hooks/useRunEstimateInputs";
import { useRouteDelete } from "../hooks/useRouteDelete";

type RouteDetailProps = {
  route: Pick<RouterOutputs["route"]["getById"], "id" | "title" | "direction">;
};

/** 保存済みルートの情報と、下見・編集・削除への操作を表示する。 */
export function RouteDetail({ route }: RouteDetailProps) {
  const { remove, isDeleting } = useRouteDelete(route.id);
  const { pace, setPace, weightKg } = useRunEstimateInputs();
  const { direction } = route;
  return (
    <section className="mx-auto max-w-2xl space-y-6 px-4 py-8 md:px-6">
      <Link href="/" className="mb-5 inline-block font-medium underline">
        ホームへ戻る
      </Link>
      <p className="text-sm text-muted-foreground">保存済みルート</p>
      <h1 className="mb-4 mt-2 break-words text-xl font-bold">{route.title}</h1>
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/routes/${route.id}/edit`}
          className="inline-block rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          aria-disabled={isDeleting}
          onClick={(event) => {
            if (isDeleting) event.preventDefault();
          }}
        >
          地図を編集
        </Link>
        <Link
          href={`/routes/${route.id}/details`}
          className="inline-block rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent"
          aria-disabled={isDeleting}
          onClick={(event) => {
            if (isDeleting) event.preventDefault();
          }}
        >
          詳細を編集
        </Link>
        <Button
          type="button"
          variant="destructive"
          disabled={isDeleting}
          onClick={() => {
            void remove();
          }}
        >
          {isDeleting ? "削除中..." : "削除する"}
        </Button>
      </div>
      <Button asChild>
        <Link
          href={`/routes/${route.id}/preview`}
          aria-disabled={isDeleting}
          onClick={(event) => {
            if (isDeleting) event.preventDefault();
          }}
        >
          Street Viewで道を見る
        </Link>
      </Button>
      <RunMetricsPanel
        distanceMeters={direction?.distanceMeters}
        isLoading={false}
        pace={pace}
        onPaceChange={setPace}
        weightKg={weightKg}
      />
    </section>
  );
}
