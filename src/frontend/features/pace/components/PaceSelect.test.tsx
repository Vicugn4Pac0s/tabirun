import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import PaceSelect from "~/frontend/features/pace/components/PaceSelect";

type MockPacesQueryResult = {
  paces: Array<{ value: string }>;
  error: Error | null;
};

const mockUsePacesQuery = vi.fn<() => MockPacesQueryResult>();
const mockSelectbox = vi.fn();

type MockSelectboxProps = {
  items?: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  value?: string;
};

vi.mock("../hooks/usePacesQuery", () => ({
  usePacesQuery: () => mockUsePacesQuery(),
}));

vi.mock("~/frontend/components/app-ui/Selectbox", () => ({
  Selectbox: (props: MockSelectboxProps) => {
    mockSelectbox(props);
    return (
      <button
        type="button"
        data-testid="selectbox"
        disabled={Boolean(props.disabled)}
        onClick={() => props.onValueChange?.("5:00")}
      >
        {String(props.placeholder ?? "")}
      </button>
    );
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUsePacesQuery.mockReturnValue({
    paces: [
      { value: "5:00" },
      { value: "6:00" },
    ],
    error: null,
  });
});

describe("PaceSelect", () => {
  it("pace 一覧を Selectbox の items に変換して渡す", () => {
    render(<PaceSelect value="5:00" onChangeValue={vi.fn()} />);

    expect(mockSelectbox).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [
          { value: "5:00", label: "5:00" },
          { value: "6:00", label: "6:00" },
        ],
        value: "5:00",
      }),
    );
  });

  it("Selectbox から有効な pace が返れば onChangeValue を呼ぶ", async () => {
    const onChangeValue = vi.fn();
    render(<PaceSelect value="5:00" onChangeValue={onChangeValue} />);

    screen.getByTestId("selectbox").click();

    expect(onChangeValue).toHaveBeenCalledWith("5:00");
  });

  it("error 時は Selectbox を disabled にし、エラーメッセージを表示する", () => {
    mockUsePacesQuery.mockReturnValue({
      paces: [],
      error: new Error("failed"),
    });

    render(<PaceSelect value="5:00" onChangeValue={vi.fn()} />);

    expect(screen.getByTestId("selectbox")).toBeDisabled();
    expect(
      screen.getByText(
        "ペース一覧を取得できませんでした。時間をおいて再度お試しください。",
      ),
    ).toBeInTheDocument();
  });
});
