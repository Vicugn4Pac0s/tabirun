import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatValue } from "~/frontend/components/app-ui/StatValue";

describe("StatValue", () => {
  it("value を表示する", () => {
    render(<StatValue value={12.3} />);

    expect(screen.getByText("12.3")).toBeInTheDocument();
  });

  it("unit 指定時は単位も表示する", () => {
    render(<StatValue value={10} unit="KM" />);

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("KM")).toBeInTheDocument();
  });

  it("className を反映する", () => {
    const { container } = render(<StatValue value={10} className="text-xl" />);

    expect(container.firstChild).toHaveClass("text-xl");
  });
});
