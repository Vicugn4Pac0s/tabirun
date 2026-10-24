import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated" }),
}));
vi.mock("~/frontend/features/auth/components/AuthUserMenu", () => ({
  AuthUserMenu: () => null,
}));
vi.mock("~/frontend/features/user/components/UserProfileDialog", () => ({
  UserProfileDialog: () => null,
}));
vi.mock("~/frontend/features/user/hooks/useUserQuery", () => ({
  useUserQuery: () => ({
    user: { name: "ランナー" },
    isLoading: false,
    error: null,
  }),
}));
vi.mock("~/frontend/features/route/hooks/useRoutesQuery", () => ({
  useRoutesQuery: () => ({
    routes: [
      {
        id: 123,
        title: "朝のルート",
        points: [
          { lat: 35, lng: 135 },
          { lat: 36, lng: 136 },
        ],
        createdAt: new Date("2026-10-24"),
        updatedAt: null,
      },
    ],
    isLoading: false,
    error: null,
  }),
}));
vi.mock("../hooks/useDashboardNavigation", () => ({
  useDashboardNavigation: () => ({ createRoute: vi.fn() }),
}));

afterEach(cleanup);

describe("Dashboard", () => {
  it("登録ルートをID指定の詳細ページへのリンクとして表示する", () => {
    render(<Dashboard />);
    expect(screen.getByRole("link", { name: /朝のルート/ })).toHaveAttribute(
      "href",
      "/routes/123",
    );
    expect(
      screen.getByRole("button", { name: "新しいルートを作る" }),
    ).toBeInTheDocument();
  });
});
