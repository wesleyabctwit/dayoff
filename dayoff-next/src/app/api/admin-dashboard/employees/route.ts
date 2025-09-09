import { NextResponse } from "next/server";
import { addEmployee } from "@/lib/sheets";

export async function GET() {
  try {
    const { readEmployees } = await import("@/lib/sheets");
    const employees = await readEmployees();
    return NextResponse.json(employees);
  } catch (error) {
    console.error("讀取員工資料錯誤:", error);
    return NextResponse.json({ error: "讀取員工資料失敗" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      hireDate,
      department,
      annualLeave,
      compensatoryLeave,
      sickLeave,
      notes,
    } = body;

    // 驗證必填欄位
    if (!name || !email || !password || !hireDate) {
      return NextResponse.json(
        {
          error: "姓名、email、密碼和到職日期為必填欄位",
        },
        { status: 400 }
      );
    }

    // 新增員工到資料庫
    const newEmployee = await addEmployee({
      name,
      email,
      password,
      hireDate,
      department: department || "",
      annualLeave: annualLeave || "0",
      compensatoryLeave: compensatoryLeave || "0",
      sickLeave: sickLeave || "0",
      notes: notes || "",
    });

    return NextResponse.json({
      success: true,
      message: "員工新增成功",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("新增員工錯誤:", error);
    return NextResponse.json(
      {
        error: "新增員工失敗",
      },
      { status: 500 }
    );
  }
}
