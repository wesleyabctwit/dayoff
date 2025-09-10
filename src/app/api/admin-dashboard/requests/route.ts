import { NextResponse } from "next/server";
import {
  readLeaveRequests,
  readEmployees,
  upsertDemoDataIfEmpty,
  LeaveRequestRow,
  EmployeeRow,
  updateLeaveRequestStatus,
  findEmployeeByEmail,
} from "@/lib/sheets";
import { sendLeaveStatusUpdateEmail } from "@/lib/email";

export async function GET() {
  try {
    await upsertDemoDataIfEmpty();
    const [requests, employees] = await Promise.all([
      readLeaveRequests(),
      readEmployees(),
    ]);
    const emailToName = new Map(
      employees.map((e: EmployeeRow) => [e.email, e.name] as const)
    );

    const mapped = requests.map((r: LeaveRequestRow) => ({
      id: Number(r.id || "0"),
      employee: emailToName.get(r.employee_email) || r.employee_email,
      date: r.date,
      type: r.type,
      days: Number(r.days || "0"),
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({ requests: mapped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) {
      return NextResponse.json(
        { message: "Missing id or status" },
        { status: 400 }
      );
    }

    const updatedRequest = await updateLeaveRequestStatus(String(id), status);

    if (updatedRequest) {
      const employee = await findEmployeeByEmail(updatedRequest.employee_email);
      if (employee) {
        await sendLeaveStatusUpdateEmail(updatedRequest, employee);
      }

      return NextResponse.json({
        success: true,
        message: "狀態更新成功",
        request: updatedRequest,
      });
    } else {
      return NextResponse.json({ message: "找不到該筆申請" }, { status: 404 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
