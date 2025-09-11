import { NextResponse } from "next/server";
import { readLeaveHistoryByEmail, LeaveRequestRow } from "@/lib/sheets";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const email = url.searchParams.get("email");
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const type = url.searchParams.get("type");
    const sortField = url.searchParams.get("sortField");
    const sortDirection = url.searchParams.get("sortDirection") as
      | "asc"
      | "desc"
      | null;

    if (!email) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 }
      );
    }

    let history = await readLeaveHistoryByEmail(email);

    // 篩選功能
    if (year) {
      history = history.filter((h) => {
        const requestDate = new Date(h.date);
        return requestDate.getFullYear() === parseInt(year);
      });
    }

    if (month) {
      history = history.filter((h) => {
        const requestDate = new Date(h.date);
        return requestDate.getMonth() + 1 === parseInt(month);
      });
    }

    if (type) {
      history = history.filter((h) => h.type === type);
    }

    // 排序功能
    if (sortField) {
      history.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
          case "date":
            aValue = new Date(a.date).getTime();
            bValue = new Date(b.date).getTime();
            break;
          case "type":
            aValue = a.type;
            bValue = b.type;
            break;
          case "period":
            aValue = a.period;
            bValue = b.period;
            break;
          case "days":
            aValue = Number(a.days || "0");
            bValue = Number(b.days || "0");
            break;
          case "reason":
            aValue = a.reason;
            bValue = b.reason;
            break;
          case "status":
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "desc" ? 1 : -1;
        if (aValue > bValue) return sortDirection === "desc" ? -1 : 1;
        return 0;
      });
    }

    const mapped = history.map((h: LeaveRequestRow) => ({
      date: h.date,
      type: h.type,
      period: h.period,
      days: Number(h.days || "0"),
      reason: h.reason,
      status: h.status,
    }));
    return NextResponse.json({ history: mapped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
