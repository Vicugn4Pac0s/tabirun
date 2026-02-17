import { K } from "vitest/dist/chunks/reporters.d.BFLkQcL6.js";
import { z } from "zod";

export const routeCreateSchema = z.object({ title: z.string().min(1), points: z.array(z.object({ lat: z.number(), lng: z.number() })).min(2), kilometers: z.number().min(0) });

export type RouteCreateInput = z.infer<typeof routeCreateSchema>;