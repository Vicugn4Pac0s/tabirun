import userEvent from "@testing-library/user-event";
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MobileSidebarSheet from "./MobileSidebarSheet";

const DESCRIPTION_WARNING =
  "Missing `Description` or `aria-describedby={undefined}` for {DialogContent}";

describe("MobileSidebarSheet", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false })),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("開いたときに Dialog の Description 不足警告を出さない", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const user = userEvent.setup({ delay: null });

    render(
      <MobileSidebarSheet
        trigger={<button type="button">メニューを開く</button>}
      >
        <p>サイドバーのコンテンツ</p>
      </MobileSidebarSheet>,
    );

    await user.click(screen.getByRole("button", { name: "メニューを開く" }));

    const dialog = screen.getByRole("dialog", { name: "メニュー" });
    expect(dialog).toBeVisible();
    expect(screen.getByText("サイドバーのコンテンツ")).toBeVisible();
    const logs = [...warn.mock.calls, ...error.mock.calls].flat().join("\n");
    expect(logs).not.toContain(DESCRIPTION_WARNING);
    expect(dialog).not.toHaveAttribute("aria-describedby");
  });
});
