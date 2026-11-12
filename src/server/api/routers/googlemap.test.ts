import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { db } from "~/server/db";
import { incrementQuota } from "~/server/quota/service";
import { googlemapRouter } from "./googlemap";

const { checkQuota, incrementQuotaMock, apiKey } = vi.hoisted(() => ({
  apiKey: "test-google-maps-key",
  checkQuota: vi.fn(),
  incrementQuotaMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("~/env", () => ({ env: { NEXT_PRIVATE_GOOGLE_MAP_API_KEY: apiKey } }));

vi.mock("~/server/db", () => ({ db: {} }));
vi.mock("~/server/auth", () => ({ auth: vi.fn() }));
vi.mock("~/server/quota/service", () => ({
  checkQuota,
  incrementQuota: incrementQuotaMock,
}));

const providerDetail = `Waypoint 3 is invalid and key=${apiKey}`;
const routePoints = [
  { lat: 35, lng: 135 },
  { lat: 36, lng: 136 },
];

function createCaller() {
  return googlemapRouter.createCaller({
    db,
    headers: new Headers(),
    session: { user: { id: "owner", role: "user" }, expires: "2099-01-01" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  checkQuota.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("googlemap.getDirection", () => {
  it("上限到達時はGoogle APIを呼ばず、クォータも加算しない", async () => {
    checkQuota.mockRejectedValue(new TRPCError({ code: "TOO_MANY_REQUESTS" }));

    await expect(
      createCaller().getDirection({ routePoints }),
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(fetch).not.toHaveBeenCalled();
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it("2地点未満の入力はGoogle APIへ送らない", async () => {
    await expect(
      createCaller().getDirection({ routePoints: [{ lat: 35, lng: 135 }] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(fetch).not.toHaveBeenCalled();
    expect(incrementQuota).not.toHaveBeenCalled();
  });

  it("始点・経由点・終点を順番どおり送り、polylineを復元する", async () => {
    const points = [
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ];
    const encodedPolyline = "_p~iF~ps|U_ulLnnqC_mqNvxq`@";
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          routes: [
            {
              distanceMeters: 1200,
              duration: "600s",
              polyline: { encodedPolyline },
            },
          ],
        }),
      ),
    );

    await expect(
      createCaller().getDirection({ routePoints: points }),
    ).resolves.toEqual({
      distanceMeters: 1200,
      duration: "600s",
      encodedPolyline,
      path: points,
    });
    expect(fetch).toHaveBeenCalledOnce();
    const signal = vi.mocked(fetch).mock.calls[0]?.[1]?.signal;
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(fetch).toHaveBeenCalledWith(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        signal,
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask":
            "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: {
            location: { latLng: { latitude: 38.5, longitude: -120.2 } },
          },
          destination: {
            location: { latLng: { latitude: 43.252, longitude: -126.453 } },
          },
          intermediates: [
            { location: { latLng: { latitude: 40.7, longitude: -120.95 } } },
          ],
          travelMode: "WALK",
        }),
      },
    );
    expect(incrementQuota).toHaveBeenCalledOnce();
  });

  it("経路がない応答はNOT_FOUNDとし、クォータを加算しない", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ routes: [] })),
    );

    await expect(
      createCaller().getDirection({ routePoints }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect(incrementQuota).not.toHaveBeenCalled();
  });

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
