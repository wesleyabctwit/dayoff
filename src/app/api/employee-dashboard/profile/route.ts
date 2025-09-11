import { NextResponse } from "next/server";
import { updateEmployee } from "@/lib/sheets";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { email, name, password, hireDate, department, notes } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const updatedEmployee = await updateEmployee(email, {
      name,
      password,
      hireDate,
      department,
      notes,
    });

    if (updatedEmployee) {
      return NextResponse.json({
        success: true,
        message: "個人資料更新成功",
        employee: updatedEmployee,
      });
    } else {
      return NextResponse.json({ message: "找不到該員工" }, { status: 404 });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Server Error";
    return NextResponse.json({ message }, { status: 500 });
  }
}
