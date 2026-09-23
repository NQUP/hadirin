import { z } from "zod";

export const officeLocationSchema = z.object({
  name: z.string().trim().min(3, "Nama wilayah minimal 3 karakter.").max(120),
  address: z.string().trim().max(500).nullable().optional(),
  latitude: z.coerce.number().gte(-90).lte(90),
  longitude: z.coerce.number().gte(-180).lte(180),
  radiusMeters: z.coerce.number().int().min(10, "Radius minimal 10 meter.").max(50_000),
  isActive: z.boolean().optional(),
});

export const employeeWorkRegionSchema = z.object({ officeLocationId: z.string().uuid().nullable() });
