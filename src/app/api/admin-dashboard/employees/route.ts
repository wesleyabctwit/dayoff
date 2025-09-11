import { NextResponse } from "next/server";
import { addEmployee } from "@/lib/sheets";

export async function GET(request: Request) {
  try {
    const { readEmployees } = await import("@/lib/sheets");
    const url = new URL(request.url);
    const sortField = url.searchParams.get("sortField");
    const sortDirection = url.searchParams.get("sortDirection") as
      | "asc"
      | "desc"
      | null;

    const employees = await readEmployees();

    // 排序
    if (sortField && sortDirection) {
      employees.sort((a, b) => {
        let aValue: string | number = a[sortField as keyof typeof a] as
          | string
          | number;
        let bValue: string | number = b[sortField as keyof typeof b] as
          | string
          | number;

        // 處理日期字串
        if (sortField === "hireDate") {
          aValue = new Date(aValue || 0).getTime();
          bValue = new Date(bValue || 0).getTime();
        }

        // 處理數字
        if (sortField === "annualLeave" || sortField === "compensatoryLeave") {
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
      特休,
      補休,
      事假,
      病假,
      喪假,
      育嬰假,
      產假,
      婚假,
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
      特休: 特休 || "0",
      補休: 補休 || "0",
      事假: 事假 || "0",
      病假: 病假 || "0",
      喪假: 喪假 || "0",
      育嬰假: 育嬰假 || "0",
      產假: 產假 || "0",
      婚假: 婚假 || "0",
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
