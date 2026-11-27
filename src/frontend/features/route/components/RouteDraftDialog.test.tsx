import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { useRouteDraftsQuery } from "../api/useRouteDraftsQuery";
import { RouteDraftDialog } from "./RouteDraftDialog";
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../api/useRouteDraftsQuery", () => ({ useRouteDraftsQuery: query }));
beforeEach(() => {
  query.mockReturnValue({ drafts: [], isLoading: false, error: null });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
describe("RouteDraftDialog", () => {
  it("閉じている間は一覧を取得しない", () => {
    render(<RouteDraftDialog open={false} onOpenChange={vi.fn()} />);
    expect(query).toHaveBeenCalledWith({ enabled: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("DBの下書きIDを使って詳細入力から再開できる", () => {
    const drafts = [
      {
        id: 42,
        title: "作成途中",
        createdById: "owner",
        createdAt: new Date(),
        updatedAt: null,
      },
    ] satisfies ReturnType<typeof useRouteDraftsQuery>["drafts"];
    query.mockReturnValue({ drafts, isLoading: false, error: null });
    render(<RouteDraftDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("link", { name: "作成途中" })).toHaveAttribute(
      "href",
      "/routes/42/details",
    );
  });
  it("下書きがなければ新規作成を案内する", () => {
    render(<RouteDraftDialog open onOpenChange={vi.fn()} />);
    expect(
      screen.getByText(/作成途中のルートはありません/),
    ).toBeInTheDocument();
  });
  it("読み込み中を表示する", () => {
    query.mockReturnValue({ drafts: [], isLoading: true, error: null });
    render(<RouteDraftDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("status")).toHaveTextContent(
      "下書きを読み込み中...",
    );
  });
  it("取得失敗はサーバーのmessageを出さずinlineで表示する", () => {
    query.mockReturnValue({
      drafts: [],
      isLoading: false,
      error: { message: "private detail" },
    });
    render(<RouteDraftDialog open onOpenChange={vi.fn()} />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      "下書きを取得できませんでした。",
    );
    expect(screen.queryByText("private detail")).toBeNull();
  });
});
