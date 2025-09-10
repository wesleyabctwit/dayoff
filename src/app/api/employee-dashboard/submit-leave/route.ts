import { NextResponse } from "next/server";
import {
  addLeaveRequest,
  findEmployeeByEmail,
  upsertDemoDataIfEmpty,
} from "@/lib/sheets";
import { sendLeaveRequestEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    await upsertDemoDataIfEmpty();
    const url = new URL(request.url);
    const email = url.searchParams.get("email") || "";

    const employee = await findEmployeeByEmail(email);
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "找不到該員工" },
        { status: 404 }
      );
    }

    const { date, period, type, days, reason } = await request.json();

    if (!date || !period || !type || !days || !reason) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    const newRequest = await addLeaveRequest({
      employee_email: email,
      date,
      period,
      type,
      days: String(days),
      reason,
      status: "pending",
    });

    // 寄送郵件通知
    await sendLeaveRequestEmail(newRequest, employee);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
