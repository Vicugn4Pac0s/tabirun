import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouteCalculatedStats } from "~/frontend/features/run-detail/components/RouteCalculatedStats";

const mockStatValue = vi.fn();
const mockCalcTimeFromDistanceAndPace = vi.fn<
  (distanceKm: number, pace: `${number}:${number}`) => string
>();
const mockCalcCaloriesFromRun = vi.fn<
  (
    weightKg: number,
    distanceKm: number,
    pace: `${number}:${number}`,
    fractionDigits?: number,
  ) => number
>();

vi.mock("~/frontend/components/app-ui/StatValue", () => ({
  StatValue: (props: { value: number | string; unit?: string }) => {
    mockStatValue(props);
    return (
      <div>
        {props.value}
        {props.unit ? ` ${props.unit}` : ""}
      </div>
    );
  },
}));

vi.mock("~/frontend/lib/running", () => ({
  calcTimeFromDistanceAndPace: (
    ...args: Parameters<typeof mockCalcTimeFromDistanceAndPace>
  ) =>
    mockCalcTimeFromDistanceAndPace(...args),
  calcCaloriesFromRun: (...args: Parameters<typeof mockCalcCaloriesFromRun>) =>
    mockCalcCaloriesFromRun(...args),
}));

describe("RouteCalculatedStats", () => {
  it("distanceKm が 0 のときは何も描画しない", () => {
    const { container } = render(
      <RouteCalculatedStats pace="5:00" distanceKm={0} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("距離・時間・カロリーを表示する", () => {
    mockCalcTimeFromDistanceAndPace.mockReturnValue("00:25:00");
    mockCalcCaloriesFromRun.mockReturnValue(320);

    render(<RouteCalculatedStats pace="5:00" distanceKm={5} weightKg={55} />);

    expect(mockCalcTimeFromDistanceAndPace).toHaveBeenCalledWith(5, "5:00");
    expect(mockCalcCaloriesFromRun).toHaveBeenCalledWith(55, 5, "5:00");
    expect(screen.getByText("5 KM")).toBeInTheDocument();
    expect(screen.getByText("00:25:00")).toBeInTheDocument();
    expect(screen.getByText("320 KCAL")).toBeInTheDocument();
  });

  it("weightKg 未指定時は既定体重 60kg を使う", () => {
    mockCalcTimeFromDistanceAndPace.mockReturnValue("00:30:00");
    mockCalcCaloriesFromRun.mockReturnValue(300);

    render(<RouteCalculatedStats pace="6:00" distanceKm={5} />);

    expect(mockCalcCaloriesFromRun).toHaveBeenCalledWith(60, 5, "6:00");
  });
});
