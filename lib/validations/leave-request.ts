import { z } from "zod";

export const leaveRequestSchema = z
  .object({
    leaveType: z.enum(["permission", "sick", "leave"]),

    startDate: z.coerce.date(),

    endDate: z.coerce.date(),

    reason: z
      .string()
      .trim()
      .min(5, "Alasan minimal 5 karakter.")
      .max(1000),

    documentPath: z.string().optional().nullable(),

    documentName: z.string().optional().nullable(),

    documentType: z.string().optional().nullable(),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
    path: ["endDate"],
  })
  .refine(
    (value) =>
      value.leaveType !== "sick" ||
      Boolean(value.documentPath),
    {
      message: "Dokumen pendukung wajib untuk pengajuan sakit.",
      path: ["documentPath"],
    },
  );

export const reviewRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),

  note: z
    .string()
    .trim()
    .max(500)
    .optional(),
});