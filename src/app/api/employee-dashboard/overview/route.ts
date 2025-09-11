import { NextResponse } from "next/server";
import {
  findEmployeeByEmail,
  getFirstEmployee,
  calculateUsedLeaveDays,
} from "@/lib/sheets";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const emailParam = url.searchParams.get("email");

    if (!emailParam) {
      return NextResponse.json(
        { message: "Email parameter is required" },
        { status: 400 }
      );
    }

    const employee = await findEmployeeByEmail(emailParam);

    if (!employee) {
      return NextResponse.json(
        { message: "No employee found" },
        { status: 404 }
      );
    }

    // 計算員工今年已使用的假期天數
    const usedLeave = await calculateUsedLeaveDays(emailParam);

    // 計算各種假別的總天數和剩餘天數
    const leaveBalances = {
      特休: {
        total: Number(employee.特休 || "0"),
        remaining: Number(employee.剩餘特休 || "0"),
        used: usedLeave.特休,
      },
      補休: {
        total: Number(employee.補休 || "0"),
        remaining: Number(employee.剩餘補休 || "0"),
        used: usedLeave.補休,
      },
      事假: {
        total: Number(employee.事假 || "0"),
        remaining: Number(employee.剩餘事假 || "0"),
        used: usedLeave.事假,
      },
      病假: {
        total: Number(employee.病假 || "0"),
        remaining: Number(employee.剩餘病假 || "0"),
        used: usedLeave.病假,
      },
      喪假: {
        total: Number(employee.喪假 || "0"),
        remaining: Number(employee.剩餘喪假 || "0"),
        used: usedLeave.喪假,
      },
      育嬰假: {
        total: Number(employee.育嬰假 || "0"),
        remaining: Number(employee.剩餘育嬰假 || "0"),
        used: usedLeave.育嬰假,
      },
      產假: {
        total: Number(employee.產假 || "0"),
        remaining: Number(employee.剩餘產假 || "0"),
        used: usedLeave.產假,
      },
      婚假: {
        total: Number(employee.婚假 || "0"),
        remaining: Number(employee.剩餘婚假 || "0"),
        used: usedLeave.婚假,
      },
    };

    return NextResponse.json({
      leaveBalances,
      profile: {
        name: employee.name,
        email: employee.email,
        hireDate: employee.hireDate,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
