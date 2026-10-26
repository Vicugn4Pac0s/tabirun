import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RunMetricsPanel } from "./RunMetricsPanel";

vi.mock("~/frontend/features/pace/components/PaceSelect", () => ({
  default: ({
    value,
    onChangeValue,
  }: {
    value: string;
    onChangeValue: (pace: "6:00") => void;
  }) => (
    <button type="button" onClick={() => onChangeValue("6:00")}>
      ペース {value}
    </button>
  ),
}));

const baseProps = {
  distanceMeters: 5200,
  isLoading: false,
  pace: "5:00" as const,
  weightKg: 60,
};

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
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: "ペース 5:00" }));
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
