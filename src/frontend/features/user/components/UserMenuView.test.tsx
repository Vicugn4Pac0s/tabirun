import type Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuardedLink } from "~/frontend/providers/GuardedLink";
import { NavigationGuardProvider } from "~/frontend/providers/NavigationGuardProvider";
import { UserMenuView } from "./UserMenuView";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("next/link", async () => {
  const { forwardRef } = await import("react");
  type LinkProps = ComponentPropsWithoutRef<typeof Link>;
  return {
    default: forwardRef<HTMLAnchorElement, LinkProps>(function TestLink(
      { href, onClick, onNavigate, children, ...props },
      ref,
    ) {
      return (
        <a
          {...props}
          ref={ref}
          href={typeof href === "string" ? href : (href.pathname ?? undefined)}
          onClick={(event) => {
            onClick?.(event);
            if (!event.defaultPrevented) {
              let prevented = false;
              onNavigate?.({
                preventDefault: () => {
                  prevented = true;
                },
              });
              if (!prevented) navigate(href);
            }
            event.preventDefault();
          }}
        >
          {children}
        </a>
      );
    }),
  };
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("UserMenuView", () => {
  it.each([true, false])(
    "プロフィールリンクの遷移許可が %s のときクリックを適切に扱う",
    async (allowed) => {
      const guard = vi.fn(() => allowed);
      const user = userEvent.setup();
      render(
        <NavigationGuardProvider confirmNavigation={guard}>
          <UserMenuView name="Runner" onLogout={vi.fn()} />
        </NavigationGuardProvider>,
      );
      await user.click(
        screen.getByRole("button", { name: "ユーザーメニュー" }),
      );
      const link = screen.getByRole("menuitem", { name: "Profile" });
      expect(link).toHaveAttribute("href", "/settings/profile");
      await user.click(link);
      expect(guard).toHaveBeenCalledOnce();
      if (allowed) expect(navigate).toHaveBeenCalledWith("/settings/profile");
      else expect(navigate).not.toHaveBeenCalled();
    },
  );

  it("キーボードでプロフィールリンクに移動できる", async () => {
    const user = userEvent.setup();
    render(<UserMenuView name="Runner" onLogout={vi.fn()} />);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("menuitem", { name: "Profile" })).toHaveFocus();
  });
  it("Provider がなければプロフィールへそのまま移動できる", async () => {
    const user = userEvent.setup();
    render(<UserMenuView name="Runner" onLogout={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "ユーザーメニュー" }));
    await user.click(screen.getByRole("menuitem", { name: "Profile" }));
    expect(navigate).toHaveBeenCalledWith("/settings/profile");
  });

  it("Context の確認処理は再描画後の最新値を使い、Provider を外すと解除される", async () => {
    const user = userEvent.setup();
    const block = vi.fn(() => false);
    const allow = vi.fn(() => true);
    const link = <GuardedLink href="/">戻る</GuardedLink>;
    const { rerender } = render(
      <NavigationGuardProvider confirmNavigation={block}>
        {link}
      </NavigationGuardProvider>,
    );
    await user.click(screen.getByRole("link", { name: "戻る" }));
    expect(navigate).not.toHaveBeenCalled();
    rerender(
      <NavigationGuardProvider confirmNavigation={allow}>
        {link}
      </NavigationGuardProvider>,
    );
    await user.click(screen.getByRole("link", { name: "戻る" }));
    expect(allow).toHaveBeenCalledOnce();
    expect(block).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledTimes(1);
    rerender(link);
    await user.click(screen.getByRole("link", { name: "戻る" }));
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(allow).toHaveBeenCalledOnce();
  });
});
