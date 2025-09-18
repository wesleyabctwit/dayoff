import { NextResponse } from "next/server";
import {
  readLeaveRequests,
  readEmployees,
  LeaveRequestRow,
  EmployeeRow,
  updateLeaveRequestStatus,
  updateEmployeeRemainingDays,
  getLeaveRequestById,
  restoreEmployeeRemainingDays,
} from "@/lib/sheets";
// import { sendLeaveStatusUpdateEmail } from "@/lib/email";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const year = url.searchParams.get("year");
    const month = url.searchParams.get("month");
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const sortField = url.searchParams.get("sortField");
    const sortDirection = url.searchParams.get("sortDirection") as
      | "asc"
      | "desc"
      | null;

    const [requests, employees] = await Promise.all([
      readLeaveRequests(),
      readEmployees(),
    ]);
    const emailToName = new Map(
      employees.map((e: EmployeeRow) => [e.email, e.name] as const)
    );

    let filteredRequests = requests.map((r: LeaveRequestRow) => {
      const employee = employees.find(
        (e: EmployeeRow) => e.email === r.employee_email
      );
      const remainingDays = employee
        ? Number(employee[`剩餘${r.type}` as keyof EmployeeRow] || "0")
        : 0;

      return {
        id: Number(r.id || "0"),
        employee: emailToName.get(r.employee_email) || r.employee_email,
        date: r.date,
        type: r.type,
        days: Number(r.days || "0"),
        remainingDays: remainingDays,
        status: r.status,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      };
    });

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

    // 假別篩選
    if (type) {
      filteredRequests = filteredRequests.filter((req) => req.type === type);
    }

    // 排序
    if (sortField && sortDirection) {
      filteredRequests.sort((a, b) => {
        let aValue: string | number = a[sortField as keyof typeof a] as
          | string
          | number;
        let bValue: string | number = b[sortField as keyof typeof b] as
          | string
          | number;

        // 處理日期字串
        if (
          sortField === "date" ||
          sortField === "createdAt" ||
          sortField === "updatedAt"
        ) {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }

        // 處理數字
        if (sortField === "days") {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        }

        // 處理字串
        if (typeof aValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = (bValue as string).toLowerCase();
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
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

    // 先取得舊狀態
    const existing = await getLeaveRequestById(String(id));
    if (!existing) {
      return NextResponse.json({ message: "找不到該筆申請" }, { status: 404 });
    }

    const updatedRequest = await updateLeaveRequestStatus(String(id), status);

    if (updatedRequest) {
      const usedDays = parseFloat(updatedRequest.days || "0");

      // 從非已核准 -> 已核准：扣除天數
      if (status === "approved") {
        await updateEmployeeRemainingDays(
          updatedRequest.employee_email,
          updatedRequest.type,
          usedDays
        );
      }

      // 從已核准 -> 非已核准：加回天數
      if (existing.status === "approved" && status !== "approved") {
        await restoreEmployeeRemainingDays(
          updatedRequest.employee_email,
          updatedRequest.type,
          usedDays
        );
      }

      // const employee = await findEmployeeByEmail(updatedRequest.employee_email);
      // if (employee) {
      //   await sendLeaveStatusUpdateEmail(updatedRequest, employee);
      // }

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
