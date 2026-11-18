import {
    BarChart3,
    Building2,
    CalendarClock,
    CalendarDays,
    ClipboardList,
    Clock3,
    FileText,
    LayoutDashboard,
    MapPin,
    Settings,
    Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type MenuItem =
    | readonly [label: string, href: string, icon: LucideIcon]
    | readonly [label: string, href: string, icon: LucideIcon, children: readonly (readonly [label: string, href: string, icon: LucideIcon])[]];

export const entries: Record<string, readonly MenuItem[]> = {
    employee: [
        ["Dashboard", "/dashboard", LayoutDashboard],
        ["Absensi Saya", "/dashboard/attendance", CalendarClock],
        ["Pengajuan", "/dashboard/requests", ClipboardList, [
            ["Izin & Cuti", "/dashboard/requests", ClipboardList],
            ["Lembur", "/dashboard/requests/overtime", Clock3],
        ]],
        ["Rekap Kehadiran", "/dashboard/reports", BarChart3],
        ["Kalender Kehadiran", "/dashboard/attendance-calendar", CalendarDays],
        ["Jadwal Kerja", "/dashboard/schedules", CalendarDays],
        ["Profil", "/dashboard/profile", Users],
    ],

    manager: [
        ["Dashboard", "/dashboard", LayoutDashboard],
        ["Tim Saya", "/dashboard/team", Users],
        ["Absensi Tim", "/dashboard/attendance", CalendarClock],
        ["Pengajuan", "/dashboard/requests", ClipboardList, [
            ["Izin & Cuti", "/dashboard/requests", ClipboardList],
            ["Lembur", "/dashboard/requests/overtime", Clock3],
        ]],
        ["Laporan", "/dashboard/reports", FileText],
        ["Kalender Kehadiran", "/dashboard/attendance-calendar", CalendarDays],
        ["Jadwal Kerja", "/dashboard/schedules", CalendarDays],
        ["Profil", "/dashboard/profile", Users],
    ],

    admin: [
        ["Dashboard", "/dashboard", LayoutDashboard],
        ["Karyawan", "/dashboard/employees", Users],

        ["Absensi", "/dashboard/attendance", CalendarClock],
        ["Pengajuan", "/dashboard/requests", ClipboardList, [
            ["Izin & Cuti", "/dashboard/requests", ClipboardList],
            ["Lembur", "/dashboard/requests/overtime", Clock3],
        ]],
        ["Laporan", "/dashboard/reports", BarChart3],
        ["Kalender Kehadiran", "/dashboard/attendance-calendar", CalendarDays],
        ["Jadwal Kerja", "/dashboard/schedules", CalendarDays],
        ["Pengaturan", "/dashboard/settings", Settings, [
            ["Wilayah Kerja", "/dashboard/settings", MapPin],
            ["Jam Absensi", "/dashboard/settings/attendance", CalendarClock],
        ]],
        ["Profil", "/dashboard/profile", Users],
    ],
} as const;
