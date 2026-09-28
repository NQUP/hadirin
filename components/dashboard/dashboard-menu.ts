import {
    BarChart3,
    Building2,
    CalendarClock,
    CalendarDays,
    ClipboardList,
    FileText,
    LayoutDashboard,
    Users,
} from "lucide-react";

export const entries = {
    employee: [
        ["Dashboard", "/dashboard", LayoutDashboard],
        ["Absensi Saya", "/dashboard/attendance", CalendarClock],
        ["Pengajuan", "/dashboard/requests", ClipboardList],
        ["Rekap Kehadiran", "/dashboard/reports", BarChart3],
        ["Kalender Kehadiran", "/dashboard/attendance-calendar", CalendarDays],
        ["Jadwal Kerja", "/dashboard/schedules", CalendarDays],
        ["Profil", "/dashboard/profile", Users],
    ],

    manager: [
        ["Dashboard", "/dashboard", LayoutDashboard],
        ["Tim Saya", "/dashboard/team", Users],
        ["Absensi Tim", "/dashboard/attendance", CalendarClock],
        ["Pengajuan", "/dashboard/requests", ClipboardList],
        ["Laporan", "/dashboard/reports", FileText],
        ["Kalender Kehadiran", "/dashboard/attendance-calendar", CalendarDays],
        ["Jadwal Kerja", "/dashboard/schedules", CalendarDays],
        ["Profil", "/dashboard/profile", Users],
    ],

    admin: [
        ["Dashboard", "/dashboard", LayoutDashboard],
        ["Karyawan", "/dashboard/employees", Users],
        ["Wilayah Kerja", "/dashboard/settings", Building2],
        ["Absensi", "/dashboard/attendance", CalendarClock],
        ["Pengajuan", "/dashboard/requests", ClipboardList],
        ["Laporan", "/dashboard/reports", BarChart3],
        ["Kalender Kehadiran", "/dashboard/attendance-calendar", CalendarDays],
        ["Jadwal Kerja", "/dashboard/schedules", CalendarDays],
        ["Profil", "/dashboard/profile", Users],
    ],
} as const;