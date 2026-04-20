import { z } from "zod";

export const routeCreateSchema = z.object({
  title: z.string().min(1),
  points: z.array(z.object({ lat: z.number(), lng: z.number() })).min(2),
  kilometers: z.number().min(0),
});

export type RouteCreateInput = z.infer<typeof routeCreateSchema>;

export const userProfileUpdateSchema = z
  .object({
    birthDate: z.string().date().nullable().optional(),
    gender: z.string().max(50).nullable().optional(),
    pace: z.string().max(255).nullable().optional(),
    height: z.number().int().positive().nullable().optional(),
    weight: z.number().int().positive().nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type UserProfileUpdateInput = z.infer<typeof userProfileUpdateSchema>;
