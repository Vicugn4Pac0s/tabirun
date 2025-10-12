import { z } from "zod";

export const postCreateSchema = z.object({ name: z.string().min(1) });

export type PostCreateInput = z.infer<typeof postCreateSchema>;