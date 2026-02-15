import { z } from "zod";

export const routeCreateSchema = z.object({ title: z.string().min(1), points: z.string().min(1) });

export type RouteCreateInput = z.infer<typeof routeCreateSchema>;