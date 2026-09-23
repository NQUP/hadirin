import { z } from "zod";

export const employeeSchema = z.object({
  employeeNumber: z.string().trim().min(3).max(30), fullName: z.string().trim().min(3).max(120), email: z.email().max(255),
  role: z.enum(["employee", "manager", "admin"]), departmentId: z.string().uuid().nullable().optional(),
  positionId: z.string().uuid().nullable().optional(), managerId: z.string().uuid().nullable().optional(), isActive: z.boolean().optional(),
});
