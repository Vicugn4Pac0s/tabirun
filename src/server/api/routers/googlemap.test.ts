import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "~/server/db";
import { incrementQuota } from "~/server/quota/service";
import { googlemapRouter } from "./googlemap";

const { checkQuota, incrementQuotaMock } = vi.hoisted(() => ({
  checkQuota: vi.fn(),
  incrementQuotaMock: vi.fn(),
}));

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/quota/service", () => ({
  checkQuota,
  incrementQuota: incrementQuotaMock,
}));

const apiKey = "test-google-maps-key";
const providerDetail = `Waypoint 3 is invalid and key=${apiKey}`;
const routePoints = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];
const originalApiKey = process.env.NEXT_PRIVATE_GOOGLE_MAP_API_KEY;

function createCaller() {
  return googlemapRouter.createCaller({
    db,
    headers: new Headers(),
    session: { user: { id: "owner", role: "user" }, expires: "2099-01-01" },
  });
}

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  process.env.NEXT_PRIVATE_GOOGLE_MAP_API_KEY = apiKey;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  if (originalApiKey === undefined) {
    delete process.env.NEXT_PRIVATE_GOOGLE_MAP_API_KEY;
  } else {
    process.env.NEXT_PRIVATE_GOOGLE_MAP_API_KEY = originalApiKey;
  }
});

describe("googlemap.getDirection", () => {
  it.each([400, 500])(
    "HTTP %s のGoogle API本文は返さず、詳細だけをサーバーログに残す",
    async (status) => {
      vi.mocked(fetch).mockResolvedValue(
        new Response(providerDetail, { status }),
      );

      await expect(
        createCaller().getDirection({ routePoints }),
      ).rejects.toMatchObject({
        code: "BAD_REQUEST",
        message: "経路を取得できませんでした。時間をおいて再度お試しください。",
      });

      expect(console.error).toHaveBeenCalledWith(
        "Google Routes API request failed",
        status,
        "Waypoint 3 is invalid and key=[redacted]",
      );
      expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(
        apiKey,
      );
      expect(incrementQuota).not.toHaveBeenCalled();
    },
  );

  it("不正な外部API応答は PARSE_ERROR ではなく INTERNAL_SERVER_ERROR にする", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({ routes: [{ distanceMeters: "not-a-number" }] }),
      ),
    );

    await expect(
      createCaller().getDirection({ routePoints }),
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
      message: "INVALID_ROUTES_API_RESPONSE",
    });
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it("正常な応答では経路を返し、クォータを加算する", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          routes: [{ distanceMeters: 1200, duration: "600s" }],
        }),
      ),
    );

    await expect(createCaller().getDirection({ routePoints })).resolves.toEqual(
      {
        distanceMeters: 1200,
        duration: "600s",
        encodedPolyline: null,
        path: [],
      },
    );
    expect(incrementQuota).toHaveBeenCalledWith(db, "owner", "direction");
  });
});
