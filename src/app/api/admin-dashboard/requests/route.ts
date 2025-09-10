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

export async function GET(request: Request) {
  try {
    await upsertDemoDataIfEmpty();

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const status = url.searchParams.get("status");

    const [requests, employees] = await Promise.all([
      readLeaveRequests(),
      readEmployees(),
    ]);
    const emailToName = new Map(
      employees.map((e: EmployeeRow) => [e.email, e.name] as const)
    );

    let filteredRequests = requests.map((r: LeaveRequestRow) => ({
      id: Number(r.id || "0"),
      employee: emailToName.get(r.employee_email) || r.employee_email,
      date: r.date,
      type: r.type,
      days: Number(r.days || "0"),
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    // 年月份篩選
    if (year && month) {
      const targetDate = `${year}-${month.padStart(2, "0")}`;
      filteredRequests = filteredRequests.filter((req) =>
        req.date.startsWith(targetDate)
      );
    } else if (year) {
      filteredRequests = filteredRequests.filter((req) =>
        req.date.startsWith(year)
      );
    }

    // 狀態篩選
    if (status) {
      filteredRequests = filteredRequests.filter(
        (req) => req.status === status
      );
    }

    // 分頁計算
    const total = filteredRequests.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    return NextResponse.json({
      requests: paginatedRequests,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
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
