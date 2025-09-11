import { NextResponse } from "next/server";
import {
  findEmployeeByEmail,
  getFirstEmployee,
  upsertDemoDataIfEmpty,
  calculateUsedLeaveDays,
} from "@/lib/sheets";

export async function GET(request: Request) {
  try {
    await upsertDemoDataIfEmpty();
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

    // 計算剩餘假期：總假期 - 已使用假期
    const totalAnnual = Number(employee.annualLeave || "0");
    const totalSick = Number(employee.sickLeave || "0");

    const remainingAnnual = Math.max(0, totalAnnual - usedLeave.annual);
    const remainingSick = Math.max(0, totalSick - usedLeave.sick);

    return NextResponse.json({
      balance: {
        annual: remainingAnnual,
        sick: remainingSick,
      },
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
