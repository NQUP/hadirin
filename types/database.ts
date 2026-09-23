export type AppRole = "employee" | "manager" | "admin";
export type AttendanceStatus = "present" | "late" | "early_leave" | "absent";
export type LeaveType = "permission" | "sick" | "leave";
export type RequestStatus = "pending" | "approved" | "rejected";

export interface Profile {
  id: string;
  employee_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: AppRole;
  department_id: string | null;
  position_id: string | null;
  manager_id: string | null;
  office_location_id: string | null;
  is_active: boolean;
}
