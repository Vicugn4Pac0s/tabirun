import { z } from "zod";

import { createTRPCRouter } from "~/server/api/trpc";
import { publicProcedure } from "../procedure";
import { TRPCError } from "@trpc/server";

const LatLngLiteral = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const googlemapRouter = createTRPCRouter({
  getDirection: publicProcedure
    .input(
      z.object({
        routePoints: z.array(LatLngLiteral),
        travelMode: z.enum(["WALK", "DRIVE", "BICYCLE"]).default("WALK"),
      }),
    )
    .query(async ({ input }) => {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAP_API_KEY;
      if (!key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "NO_API_KEY" });

      if(input.routePoints.length < 2) return null;
      
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

      if (!res.ok) throw new TRPCError({ code: "BAD_REQUEST", message: await res.text() });

      const json = await res.json();
      const r = json?.routes?.[0];
      if (!r) throw new TRPCError({ code: "NOT_FOUND", message: "NO_ROUTE" });

      return {
        distanceMeters: r.distanceMeters ?? null,
        duration: r.duration ?? null,
        encodedPolyline: r.polyline?.encodedPolyline ?? null,
      };
    }),
});