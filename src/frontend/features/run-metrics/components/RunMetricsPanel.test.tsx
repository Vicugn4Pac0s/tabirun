import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { RunMetricsPanel } from "./RunMetricsPanel";

vi.mock("~/frontend/features/pace/api/usePacesQuery", () => ({
  usePacesQuery: () => ({
    paces: [{ value: "5:00" }, { value: "6:00" }],
    error: null,
  }),
}));

const baseProps = {
  distanceMeters: 5200,
  isLoading: false,
  pace: "5:00" as const,
  weightKg: 60,
};

// jsdomには選択肢を表示位置へ移動するブラウザAPIがない。
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
    configurable: true,
    value: vi.fn(),
  });
});

afterAll(() => {
  Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

describe("RunMetricsPanel", () => {
  it("距離・予想時間・消費カロリーを表示し、ペース変更を通知する", async () => {
    const onPaceChange = vi.fn();
    const { rerender } = render(
      <RunMetricsPanel {...baseProps} onPaceChange={onPaceChange} />,
    );

    expect(screen.getByText("距離")).toBeInTheDocument();
    expect(screen.getByText("5.2")).toBeInTheDocument();
    expect(screen.getByText("予想時間")).toBeInTheDocument();
    expect(screen.getByText("00:26:00")).toBeInTheDocument();
    expect(screen.getByText("消費カロリー")).toBeInTheDocument();
    expect(screen.getByText("343")).toBeInTheDocument();
    const user = userEvent.setup();
    const paceSelect = screen.getByRole("combobox", { name: "ペース" });
    expect(screen.getByLabelText("ペース")).toBe(paceSelect);
    expect(paceSelect).toHaveAttribute("aria-invalid", "false");
    expect(paceSelect).not.toHaveAttribute("aria-describedby");
    await user.click(screen.getByText("ペース", { selector: "label" }));
    expect(paceSelect).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{End}{Enter}");
    expect(onPaceChange).toHaveBeenCalledWith("6:00");
    rerender(
      <RunMetricsPanel
        {...baseProps}
        pace="6:00"
        onPaceChange={onPaceChange}
      />,
    );
    expect(screen.getByText("00:31:12")).toBeInTheDocument();
    expect(screen.getByText("312")).toBeInTheDocument();
  });

  it("距離の計測中と未取得を区別し、未取得を0kmとして表示しない", () => {
    const { rerender } = render(
      <RunMetricsPanel
        {...baseProps}
        distanceMeters={null}
        isLoading
        onPaceChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("距離を計測中");
    expect(screen.queryByText("0")).not.toBeInTheDocument();

    rerender(
      <RunMetricsPanel
        {...baseProps}
        distanceMeters={null}
        isLoading={false}
        onPaceChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "距離を表示できません",
    );

    rerender(
      <RunMetricsPanel
        {...baseProps}
        distanceMeters={0}
        onPaceChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "距離を表示できません",
    );
  });

  it("体重未設定時は既定値の60kgで計算する", () => {
    render(
      <RunMetricsPanel
        distanceMeters={5200}
        isLoading={false}
        pace="5:00"
        onPaceChange={vi.fn()}
      />,
    );

    expect(screen.getByText("343")).toBeInTheDocument();
  });
});
