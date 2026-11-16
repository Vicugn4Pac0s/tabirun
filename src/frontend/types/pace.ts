import type { z } from "zod";
import type { paceSchema } from "~/shared/schemas";

export type Pace = z.infer<typeof paceSchema>;
