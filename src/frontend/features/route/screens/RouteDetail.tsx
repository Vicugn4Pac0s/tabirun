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
    <section className="space-y-8">
      <Link href="/" className="inline-block font-medium underline">
        ホームへ戻る
      </Link>
      <header className="space-y-2 border-b pb-6">
        <p className="text-sm text-muted-foreground">保存済みルート</p>
        <h1 className="break-words text-xl font-bold">{route.title}</h1>
      </header>
      <div className="grid min-w-0 gap-8 md:grid-cols-[minmax(0,1fr)_16rem] md:gap-12">
        <div className="min-w-0">
          <RunMetricsPanel
            distanceMeters={direction?.distanceMeters}
            isLoading={false}
            pace={pace}
            onPaceChange={setPace}
            weightKg={weightKg}
          />
        </div>
        <nav aria-label="ルート操作" className="flex min-w-0 flex-col gap-3">
          <Button
            asChild
            className="h-12 rounded-lg aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
          >
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
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-lg shadow-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
            >
              <Link
                href={`/routes/${route.id}/edit`}
                aria-disabled={isDeleting}
                onClick={(event) => {
                  if (isDeleting) event.preventDefault();
                }}
              >
                地図を編集
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-lg shadow-none aria-disabled:cursor-not-allowed aria-disabled:opacity-40"
            >
              <Link
                href={`/routes/${route.id}/details`}
                aria-disabled={isDeleting}
                onClick={(event) => {
                  if (isDeleting) event.preventDefault();
                }}
              >
                詳細を編集
              </Link>
            </Button>
          </div>
          <Button
            type="button"
            variant="ghost"
            className="h-10 self-center rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isDeleting}
            onClick={() => {
              void remove();
            }}
          >
            {isDeleting ? "削除中..." : "削除する"}
          </Button>
        </nav>
      </div>
    </section>
  );
}
