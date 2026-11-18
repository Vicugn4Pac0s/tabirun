import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "~/server/db";
import {
  getDirection,
  tryGetDirection,
} from "~/server/features/direction/service";

const mocks = vi.hoisted(() => ({
  computeRoute: vi.fn(),
  incrementQuota: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/features/direction/client", () => ({
  computeRoute: mocks.computeRoute,
}));
vi.mock("~/server/quota/service", () => ({
  incrementQuota: mocks.incrementQuota,
}));

const input = {
  routePoints: [
    { lat: 35, lng: 135 },
    { lat: 36, lng: 136 },
  ],
} satisfies Parameters<typeof getDirection>[2];
const direction = {
  distanceMeters: 100,
  duration: "60s",
  encodedPolyline: null,
  path: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.incrementQuota.mockResolvedValue(undefined);
});

describe("getDirection", () => {
  it("tryGetDirectionも成功時は経路を返し、1回だけ計上する", async () => {
    mocks.computeRoute.mockResolvedValue(direction);
    await expect(tryGetDirection(db, "owner", input)).resolves.toEqual(
      direction,
    );
    expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
      db,
      "owner",
      "direction",
    );
  });
  it.each([false, true])(
    "計算失敗をnullに変換でき、送信開始=%sに応じて計上する",
    async (started) => {
      const error = new Error("compute failure");
      mocks.computeRoute.mockImplementation(
        (_input: unknown, onRequestStarted: () => void) => {
          if (started) onRequestStarted();
          throw error;
        },
      );
      await expect(tryGetDirection(db, "owner", input)).resolves.toBeNull();
      expect(mocks.incrementQuota).toHaveBeenCalledTimes(started ? 1 : 0);
    },
  );

  it.each(["success", "failure"])(
    "null変換を指定しても通信%s後の計上DB障害は伝播する",
    async (result) => {
      mocks.computeRoute.mockImplementation(
        (_input: unknown, onRequestStarted: () => void) => {
          onRequestStarted();
          if (result === "failure") throw new Error("compute failure");
          return direction;
        },
      );
      const error = new Error("database failure");
      mocks.incrementQuota.mockRejectedValue(error);
      await expect(tryGetDirection(db, "owner", input)).rejects.toBe(error);
      expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
        db,
        "owner",
        "direction",
      );
    },
  );

  it("送信前の失敗は計上せず、元の例外を返す", async () => {
    const error = new Error("before request");
    mocks.computeRoute.mockRejectedValue(error);
    await expect(getDirection(db, "owner", input)).rejects.toBe(error);
    expect(mocks.incrementQuota).not.toHaveBeenCalled();
  });

  it("結果を受け取ったら1回計上して返す", async () => {
    mocks.computeRoute.mockResolvedValue(direction);
    await expect(getDirection(db, "owner", input)).resolves.toEqual(direction);
    expect(mocks.computeRoute).toHaveBeenCalledWith(
      input,
      expect.any(Function),
    );
    expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
      db,
      "owner",
      "direction",
    );
  });

  it("送信後の失敗は1回計上し、元の例外を返す", async () => {
    const error = new Error("network failure");
    mocks.computeRoute.mockImplementation(
      (_input: unknown, onRequestStarted: () => void) => {
        onRequestStarted();
        throw error;
      },
    );
    await expect(getDirection(db, "owner", input)).rejects.toBe(error);
    expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
      db,
      "owner",
      "direction",
    );
  });

  it.each(["success", "failure"])(
    "通信の%s時も計上DB障害を伝播し、再計上しない",
    async (result) => {
      mocks.computeRoute.mockImplementation(
        (_input: unknown, onRequestStarted: () => void) => {
          onRequestStarted();
          if (result === "failure") throw new Error("network failure");
          return direction;
        },
      );
      const error = new Error("database failure");
      mocks.incrementQuota.mockRejectedValue(error);
      await expect(getDirection(db, "owner", input)).rejects.toBe(error);
      expect(mocks.incrementQuota).toHaveBeenCalledExactlyOnceWith(
        db,
        "owner",
        "direction",
      );
    },
  );
});
