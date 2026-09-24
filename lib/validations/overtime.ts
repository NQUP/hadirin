import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const overtimeRequestSchema = z
  .object({
    overtimeDate: z.string().trim().min(1, "Tanggal lembur wajib diisi."),
    startTime: z.string().trim().regex(timePattern, "Jam mulai tidak valid."),
    endTime: z.string().trim().regex(timePattern, "Jam selesai tidak valid."),
    reason: z.string().trim().min(5, "Alasan lembur minimal 5 karakter.").max(1000),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: "Jam selesai harus lebih besar dari jam mulai.",
    path: ["endTime"],
  });

export const reviewOvertimeSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(500).optional(),
});
