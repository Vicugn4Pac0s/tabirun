import "server-only";

import { env } from "~/env";
import { z } from "zod";
import { decode } from "@googlemaps/polyline-codec";
import { TRPCError } from "@trpc/server";
import { routePointsSchema } from "~/shared/schemas";

export const DirectionInputSchema = z.object({
  routePoints: routePointsSchema,
  travelMode: z.enum(["WALK", "DRIVE", "BICYCLE"]).default("WALK"),
});

const decodePolylineToLatLngLiteral = (encoded: string) => {
  return decode(encoded).map(([lat, lng]) => ({
    lat,
    lng,
  }));
};

export const DirectionOutputSchema = z.object({
  distanceMeters: z.number().nullable(),
  duration: z.string().nullable(),
  encodedPolyline: z.string().nullable(),
  path: z.array(
    z.object({
      lat: z.number(),
      lng: z.number(),
    }),
  ),
});
export type GoogleRouteDirection = z.infer<typeof DirectionOutputSchema>;

const ComputeRoutesResponseSchema = z.object({
  routes: z
    .array(
      z.object({
        distanceMeters: z.number().optional(),
        duration: z.string().optional(),
        polyline: z
          .object({
            encodedPolyline: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export async function computeRoute(
  input: z.infer<typeof DirectionInputSchema>,
  onRequestStarted?: () => void,
): Promise<GoogleRouteDirection> {
  const key = env.NEXT_PRIVATE_GOOGLE_MAP_API_KEY;
  if (!key) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "NO_API_KEY",
    });
  }

  const pts = input.routePoints;
  const origin = pts[0];
  const destination = pts[pts.length - 1];
  if (!origin || !destination || pts.length < 2) {
    throw new TRPCError({ code: "BAD_REQUEST" });
  }
  const intermediates = pts.slice(1, -1);

  // 通信例外では到達を断定できないため、送信試行の開始を呼出側へ知らせる。
  onRequestStarted?.();
  const res = await fetch(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      signal: AbortSignal.timeout(10_000),
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask":
          "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
      },
      body: JSON.stringify({
        origin: {
          location: {
            latLng: { latitude: origin.lat, longitude: origin.lng },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude: destination.lat,
              longitude: destination.lng,
            },
          },
        },
        intermediates: intermediates.map((p) => ({
          location: { latLng: { latitude: p.lat, longitude: p.lng } },
        })),
        travelMode: input.travelMode,
      }),
    },
  );

  if (!res.ok) {
    // 応答本文に外部APIの詳細が含まれるため、クライアントには返さずログだけ残す。
    const detail = (await res.text()).replaceAll(key, "[redacted]");
    console.error("Google Routes API request failed", res.status, detail);
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "経路を取得できませんでした。時間をおいて再度お試しください。",
    });
  }

  const raw: unknown = await res.json();
  const parsed = ComputeRoutesResponseSchema.safeParse(raw);

  if (!parsed.success) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "INVALID_ROUTES_API_RESPONSE",
    });
  }

  const r = parsed.data.routes?.[0];
  if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "NO_ROUTE" });

  const encodedPolyline = r.polyline?.encodedPolyline ?? null;
  const path = encodedPolyline
    ? decodePolylineToLatLngLiteral(encodedPolyline)
    : [];
  return {
    distanceMeters: r.distanceMeters ?? null,
    duration: r.duration ?? null,
    encodedPolyline,
    path,
  };
}
