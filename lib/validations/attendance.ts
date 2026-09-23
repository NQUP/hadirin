import { z } from "zod";

export const locationSchema = z.object({ latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180) });
export const clockSchema = locationSchema.extend({ selfiePath: z.string().trim().min(8).max(500).regex(/^[a-f0-9-]+\/[0-9]{4}-[0-9]{2}-[0-9]{2}\/(clock-in|clock-out)-[0-9]+\.jpg$/, "Path selfie tidak valid.") });
