import { NextResponse } from "next/server";

import { requireApiProfile } from "@/lib/auth";
import { getAttendanceSummary } from "@/lib/attendance-summary";
import { getPeriodRange, parseEmployeeId, todayInJakarta } from "@/lib/report-period";

export async function GET(request: Request) {
    const access = await requireApiProfile();
    const profile = access.profile;
    if (!profile) return NextResponse.json({ message: access.error }, { status: access.status });

    const params = new URL(request.url).searchParams;
    const period = params.get("period") || "monthly";
    const selectedDate = params.get("date") || (period === "monthly" ? todayInJakarta().slice(0, 7) : todayInJakarta());
    const employeeId = profile.role === "employee" ? undefined : parseEmployeeId(params.get("employeeId") ?? undefined);
    const range = getPeriodRange(period, selectedDate, params.get("from") ?? undefined, params.get("to") ?? undefined);

    try {
        const result = await getAttendanceSummary(profile, { ...range, employeeId });
        return NextResponse.json(
            { from: result.from, to: result.to, records: result.records },
            { headers: { "Cache-Control": "no-store" } },
        );
    } catch (error) {
        const invalidPeriod = error instanceof Error && error.message === "Periode rekap tidak valid.";
        return NextResponse.json(
            { message: invalidPeriod ? "Periode rekap tidak valid." : "Gagal mengambil data rekap." },
            { status: invalidPeriod ? 400 : 500 },
        );
    }
}