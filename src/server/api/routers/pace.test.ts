import { beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "~/server/db";
import { paces } from "~/server/db/schema";
import { paceRouter } from "./pace";

const { select, from } = vi.hoisted(() => ({
  select: vi.fn(),
  from: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/db", () => ({ db: { select } }));

function createCaller() {
  return paceRouter.createCaller({
    db,
    headers: new Headers(),
    session: null,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  select.mockReturnValue({ from });
});

describe("pace.getPace", () => {
  it("未ログインでも公開マスターの全行をそのまま返す", async () => {
    const rows = [
      { id: 2, value: "6:00" },
      { id: 1, value: "5:00" },
    ] satisfies (typeof paces.$inferSelect)[];
    from.mockResolvedValue(rows);
    await expect(createCaller().getPace()).resolves.toEqual(rows);
    expect(select).toHaveBeenCalledExactlyOnceWith();
    expect(from).toHaveBeenCalledExactlyOnceWith(paces);
  });

  it("登録がなければ空配列を返す", async () => {
    from.mockResolvedValue([]);
    await expect(createCaller().getPace()).resolves.toEqual([]);
  });

  it("DB障害を空配列に変換せずエラーにする", async () => {
    const error = new Error("database failure");
    from.mockRejectedValue(error);
    await expect(createCaller().getPace()).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      cause: error,
    });
  });
});
