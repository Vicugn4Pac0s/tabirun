import { z } from "zod";
import { decode } from "@googlemaps/polyline-codec";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "../procedure";

const LatLngLiteral = z.object({
  lat: z.number(),
  lng: z.number(),
});

const decodePolylineToLatLngLiteral = (encoded: string) => {
  return decode(encoded).map(([lat, lng]) => ({
    lat,
    lng,
  }));
};

const DirectionOutputSchema = z.object({
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

export const googlemapRouter = createTRPCRouter({
  getDirection: publicProcedure
    .input(
      z.object({
        routePoints: z.array(LatLngLiteral).min(2),
        travelMode: z.enum(["WALK", "DRIVE", "BICYCLE"]).default("WALK"),
      }),
    )
    .output(DirectionOutputSchema)
    .query(async ({ input }) => {
      const key = process.env.NEXT_PRIVATE_GOOGLE_MAP_API_KEY;
      if (!key) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "NO_API_KEY" });
      }

      const pts = input.routePoints;
      const origin = pts[0]!;
      const destination = pts[pts.length - 1]!;
      const intermediates = pts.slice(1, -1);

      const res = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": key,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline",
        },
        body: JSON.stringify({
          origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
          destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
          intermediates: intermediates.map((p) => ({
            location: { latLng: { latitude: p.lat, longitude: p.lng } },
          })),
          travelMode: input.travelMode,
        }),
      });

      if (!res.ok) {
        throw new TRPCError({ code: "BAD_REQUEST", message: await res.text() });
      }

      const raw = (await res.json()) as unknown;
      const parsed = ComputeRoutesResponseSchema.safeParse(raw);

      if (!parsed.success) {
        throw new TRPCError({ code: "PARSE_ERROR", message: "INVALID_ROUTES_API_RESPONSE" });
      }

      const r = parsed.data.routes?.[0];
      if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "NO_ROUTE" });

      const encodedPolyline = r.polyline?.encodedPolyline ?? null;
      const path = encodedPolyline ? decodePolylineToLatLngLiteral(encodedPolyline) : [];

      return {
        distanceMeters: r.distanceMeters ?? null,
        duration: r.duration ?? null,
        encodedPolyline,
        path,
      };
    }),
});