import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./Dashboard";

const { routesQuery } = vi.hoisted(() => ({ routesQuery: vi.fn() }));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated" }),
}));
vi.mock("~/frontend/features/auth/components/AuthUserMenu", () => ({
  AuthUserMenu: () => null,
}));
vi.mock("~/frontend/features/user/api/useCurrentUserQuery", () => ({
  useCurrentUserQuery: () => ({
    user: { name: "ランナー" },
    isLoading: false,
    error: null,
  }),
}));
vi.mock("~/frontend/features/route/api/useRoutesQuery", () => ({
  useRoutesQuery: routesQuery,
}));
beforeEach(() => {
  routesQuery.mockReturnValue({
    routes: [
      {
        id: 123,
        title: "朝のルート",
        createdAt: new Date("2026-10-24"),
        updatedAt: null,
      },
    ],
    isLoading: false,
    error: null,
  });
});

afterEach(cleanup);

describe("Dashboard", () => {
  it("登録ルートをID指定の詳細ページへのリンクとして表示する", () => {
    render(<Dashboard />);
    expect(
      screen.getByRole("heading", { name: "朝のルート" }),
    ).toBeInTheDocument();
    expect(screen.getByText("更新日：2026/10/24")).toBeInTheDocument();
    expect(screen.queryByText(/\d+\s*地点/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /朝のルート/ })).toHaveAttribute(
      "href",
      "/routes/123",
    );
    expect(
      screen.getByRole("link", { name: "プロフィールを編集" }),
    ).toHaveAttribute("href", "/settings/profile");
    expect(
      screen.getByRole("link", { name: "新しいルートを作る" }),
    ).toHaveAttribute("href", "/routes/new");
  });
  it("ルート未登録時の作成リンクも新規作成画面へ向く", () => {
    routesQuery.mockReturnValue({ routes: [], isLoading: false, error: null });
    render(<Dashboard />);
    expect(screen.getByRole("link", { name: "ルートを作る" })).toHaveAttribute(
      "href",
      "/routes/new",
    );
  });
});
