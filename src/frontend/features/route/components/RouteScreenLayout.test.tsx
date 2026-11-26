import { useState } from "react";
import {
  act,
  fireEvent,
  cleanup,
  render,
  screen,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteScreenLayout } from "./RouteScreenLayout";
import RouteMenuButton from "./RouteMenuButton";

vi.mock("~/frontend/features/auth/components/AuthUserMenu", () => ({
  AuthUserMenu: () => <button type="button">ユーザーメニュー</button>,
}));

function Fixture() {
  const [value, setValue] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <RouteScreenLayout
      sidebarOpen={sidebarOpen}
      onSidebarOpenChange={setSidebarOpen}
      sidebar={
        <input
          aria-label="入力値"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      }
    >
      <RouteMenuButton
        label="5.2 km"
        aria-label={`ルート情報を${sidebarOpen ? "閉じる" : "開く"}`}
        aria-expanded={sidebarOpen}
        onClick={() => setSidebarOpen((value) => !value)}
      />
      <div>地図とStreet View</div>
    </RouteScreenLayout>
  );
}

let mobile = false;
let onViewportChange: (() => void) | undefined;
beforeEach(() => {
  mobile = false;
  onViewportChange = undefined;
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      get matches() {
        return mobile;
      },
      addEventListener: (_event: string, callback: () => void) => {
        onViewportChange = callback;
      },
      removeEventListener: vi.fn(),
    })),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("RouteScreenLayout", () => {
  it("閉じた状態で開始し、PCでは距離ボタンで開閉してフォーカスを戻す", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const trigger = screen.getByRole("button", { name: "ルート情報を開く" });
    expect(trigger).toHaveTextContent("5.2 km");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    await user.click(trigger);
    const panel = screen.getByRole("complementary", { name: "ルート情報" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(
      within(panel).getByRole("button", { name: "ルート情報を閉じる" }),
    ).toHaveFocus();
    await user.click(trigger);
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("閉じても入力状態と地図を保持し、Escapeでも閉じる", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const map = screen.getByText("地図とStreet View");
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    await user.type(
      screen.getByRole("textbox", { name: "入力値" }),
      "保持する値",
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ルート情報を開く" }),
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    expect(screen.getByRole("textbox", { name: "入力値" })).toHaveValue(
      "保持する値",
    );
    expect(screen.getByText("地図とStreet View")).toBe(map);
  });

  it("スマホはモーダルとして開き、Escapeで閉じても編集状態を保持する", async () => {
    mobile = true;
    const user = userEvent.setup();
    render(<Fixture />);
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    const dialog = screen.getByRole("dialog", { name: "ルート情報" });
    fireEvent.change(within(dialog).getByRole("textbox"), {
      target: { value: "スマホの入力" },
    });
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ルート情報を開く" }),
    ).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    expect(screen.getByRole("textbox")).toHaveValue("スマホの入力");
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "ルート情報を閉じる",
      }),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("開いたままPCとスマホを往復しても入力・開閉状態・地図を維持する", async () => {
    const user = userEvent.setup();
    render(<Fixture />);
    const map = screen.getByText("地図とStreet View");
    await user.click(screen.getByRole("button", { name: "ルート情報を開く" }));
    await user.type(screen.getByRole("textbox"), "画面幅を変更");
    act(() => {
      mobile = true;
      onViewportChange?.();
    });
    expect(
      screen.getByRole("dialog", { name: "ルート情報" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("画面幅を変更");
    act(() => {
      mobile = false;
      onViewportChange?.();
    });
    expect(
      screen.getByRole("complementary", { name: "ルート情報" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("画面幅を変更");
    expect(screen.getByText("地図とStreet View")).toBe(map);
    await user.keyboard("{Escape}");
    expect(
      screen.getByRole("button", { name: "ルート情報を開く" }),
    ).toHaveFocus();
  });
});
