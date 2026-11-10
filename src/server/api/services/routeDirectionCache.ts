import "server-only";

import { createHash } from "node:crypto";
import { decode, encode } from "@googlemaps/polyline-codec";
import { z } from "zod";
import { routePointsSchema } from "~/shared/schemas";

export const ROUTE_DIRECTION_CACHE_MAX_AGE_MS = 29 * 24 * 60 * 60 * 1000;

const snapshotFields = {
  directionCalculatedAt: z.date(),
  directionPointsHash: z.string().regex(/^[a-f0-9]{64}$/),
};

const snapshotSchema = z.discriminatedUnion("directionSource", [
  z.object({
    ...snapshotFields,
    directionSource: z.literal("routes_api"),
    encodedPolyline: z.string().min(1),
    distanceMeters: z.number().int().nonnegative(),
    duration: z.string().regex(/^\d+(?:\.\d{1,9})?s$/),
  }),
  z.object({
    ...snapshotFields,
    directionSource: z.literal("straight_line"),
    encodedPolyline: z.null(),
    distanceMeters: z.null(),
    duration: z.null(),
  }),
]);

type RoutePoints = z.infer<typeof routePointsSchema>;
export type RouteDirectionSnapshot = z.infer<typeof snapshotSchema>;
export type SavedRouteDirection = RouteDirectionSnapshot & {
  path: RoutePoints;
};

export function getRoutePointsHash(points: RoutePoints): string {
  const validatedPoints = routePointsSchema.parse(points);
  // 移動手段・計算条件を変える場合に、既存の結果を誤って使わないための識別子。
  return createHash("sha256")
    .update(
      JSON.stringify([
        "v1",
        "WALK",
        validatedPoints.map(({ lat, lng }) => [lat, lng]),
      ]),
    )
    .digest("hex");
}

export function getReusableRouteDirection(
  saved: unknown,
  points: RoutePoints,
  now: Date,
): SavedRouteDirection | null {
  const parsed = snapshotSchema.safeParse(saved);
  if (!parsed.success) return null;
  const snapshot = parsed.data;
  const age = now.getTime() - snapshot.directionCalculatedAt.getTime();
  if (
    !Number.isFinite(age) ||
    age < 0 ||
    age >= ROUTE_DIRECTION_CACHE_MAX_AGE_MS ||
    snapshot.directionPointsHash !== getRoutePointsHash(points)
  ) {
    return null;
  }

  if (snapshot.directionSource === "straight_line") {
    // クォータはUTC日付で回復するため、直線結果で翌日の再取得を妨げない。
    if (
      snapshot.directionCalculatedAt.toISOString().slice(0, 10) !==
      now.toISOString().slice(0, 10)
    ) {
      return null;
    }
    return { ...snapshot, path: points };
  }

  try {
    const decoded = decode(snapshot.encodedPolyline);
    // decoderが補完する壊れた文字列も、永続化された経路としては使わない。
    if (
      decoded.length < 2 ||
      encode(decoded) !== snapshot.encodedPolyline ||
      decoded.some(
        ([lat, lng]) =>
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          Math.abs(lat) > 90 ||
          Math.abs(lng) > 180,
      )
    ) {
      return null;
    }
    return {
      ...snapshot,
      path: decoded.map(([lat, lng]) => ({ lat, lng })),
    };
  } catch {
    return null;
  }
}
