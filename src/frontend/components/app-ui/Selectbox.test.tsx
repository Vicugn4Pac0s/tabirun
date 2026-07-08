import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { Selectbox } from "~/frontend/components/app-ui/Selectbox";

const mockRoot = vi.fn();
const mockTrigger = vi.fn();
const mockValue = vi.fn();
const mockLabel = vi.fn();

type RootProps = {
  children?: ReactNode;
  value?: string;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
};

type TriggerProps = {
  children?: ReactNode;
};

type ValueProps = {
  placeholder?: string;
};

vi.mock("~/frontend/components/ui/select", () => ({
  Select: (props: RootProps) => {
    mockRoot(props);
    return <div data-testid="select-root">{props.children}</div>;
  },
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div data-testid={`item-${value}`}>{children}</div>,
  SelectLabel: ({ children }: { children: React.ReactNode }) => {
    mockLabel(children);
    return <div>{children}</div>;
  },
  SelectTrigger: (props: TriggerProps) => {
    mockTrigger(props);
    return <button type="button">{props.children}</button>;
  },
  SelectValue: (props: ValueProps) => {
    mockValue(props);
    return <span>{String(props.placeholder ?? "")}</span>;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Selectbox", () => {
  it("value と disabled を Select に渡す", () => {
    render(
      <Selectbox
        items={[{ value: "a", label: "A" }]}
        value="a"
        disabled
        onValueChange={vi.fn()}
      />,
    );

    expect(mockRoot).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "a",
        disabled: true,
      }),
    );
  });

  it("placeholder を SelectValue に渡し、items を描画する", () => {
    render(
      <Selectbox
        items={[
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ]}
        placeholder="選択してください"
      />,
    );

    expect(mockValue).toHaveBeenCalledWith(
      expect.objectContaining({
        placeholder: "選択してください",
      }),
    );
    expect(screen.getByTestId("item-a")).toHaveTextContent("A");
    expect(screen.getByTestId("item-b")).toHaveTextContent("B");
  });

  it("label 指定時は SelectLabel を描画する", () => {
    render(
      <Selectbox
        items={[{ value: "a", label: "A" }]}
        label="Pace"
      />,
    );

    expect(mockLabel).toHaveBeenCalledWith("Pace");
  });
});
