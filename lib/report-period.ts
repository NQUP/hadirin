export function valueOf(value: string | string[] | undefined) {
    return Array.isArray(value) ? value[0] : value;
}

export function todayInJakarta() {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(new Date());
}

export function parseEmployeeId(value: string | undefined) {
    return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ? value : undefined;
}

export function getPeriodRange(period: string, selectedDate: string, from?: string, to?: string) {
    if (period === "custom") {
        return { from: from || selectedDate, to: to || selectedDate };
    }

    if (period === "daily") {
        return { from: selectedDate, to: selectedDate };
    }

    if (period === "weekly") {
        const date = new Date(`${selectedDate}T00:00:00Z`);
        const mondayOffset = (date.getUTCDay() + 6) % 7;
        date.setUTCDate(date.getUTCDate() - mondayOffset);
        const start = date.toISOString().slice(0, 10);
        date.setUTCDate(date.getUTCDate() + 6);
        return { from: start, to: date.toISOString().slice(0, 10) };
    }

    const month = /^\d{4}-\d{2}$/.test(selectedDate) ? selectedDate : selectedDate.slice(0, 7);
    const [year, monthNumber] = month.split("-").map(Number);
    const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    return { from: `${month}-01`, to: `${month}-${String(lastDay).padStart(2, "0")}` };
}