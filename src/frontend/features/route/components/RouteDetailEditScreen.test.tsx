import { cleanup, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RouteUpdateDetailsInput } from "~/shared/schemas";
import { RouteDetailEditScreen } from "./RouteDetailEditScreen";

vi.mock("../hooks/useRouteDetailEdit", () => ({
  useRouteDetailEdit: (route: RouteUpdateDetailsInput) => ({
    form: useForm<RouteUpdateDetailsInput>({ defaultValues: route }),
    save: vi.fn(),
    editMap: vi.fn(),
    isSaving: false,
    canSave: true,
    confirmNavigation: () => true,
  }),
}));
vi.mock("~/frontend/features/run-metrics/hooks/useRunEstimateInputs", () => ({
  useRunEstimateInputs: () => ({
    pace: "5:00",
    setPace: vi.fn(),
    weightKg: 60,
  }),
}));
vi.mock("~/frontend/features/run-metrics/components/RunMetricsPanel", () => ({
  RunMetricsPanel: () => null,
}));
afterEach(cleanup);

describe("RouteDetailEditScreenの戻りリンク", () => {
  it("下書きはホームへのリンクだけを表示する", () => {
    render(
      <RouteDetailEditScreen
        route={{
          id: 42,
          title: "下書き",
          status: "draft",
          direction: null,
          directionErrorCode: null,
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "ホームへ戻る" })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByRole("link", { name: "ルートに戻る" })).toBeNull();
    expect(screen.queryByRole("link", { name: "ルート作成に戻る" })).toBeNull();
  });

  it("完了済みは閲覧ページへのリンクだけを表示する", () => {
    render(
      <RouteDetailEditScreen
        route={{
          id: 42,
          title: "完了済み",
          status: "completed",
          direction: null,
          directionErrorCode: null,
        }}
      />,
    );
    expect(screen.getByRole("link", { name: "ルートに戻る" })).toHaveAttribute(
      "href",
      "/routes/42",
    );
    expect(screen.queryByRole("link", { name: "ホームへ戻る" })).toBeNull();
  });
});
