import { NextResponse } from "next/server";
import { findEmployeeByEmail } from "@/lib/sheets";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "請提供 email 和密碼",
        },
        { status: 400 }
      );
    }

    // 檢查是否為管理員帳號
    if (email === "wesleyabctw.it@gmail.com") {
      if (password === "admin1234") {
        return NextResponse.json({
          success: true,
          role: "admin",
          name: "管理員",
          email: "wesleyabctw.it@gmail.com",
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            message: "管理員密碼錯誤",
          },
          { status: 401 }
        );
      }
    }

    // 如果不是管理員，則查詢員工資料庫
    try {
      // 從 Google Sheets 資料庫中查找員工
      const employee = await findEmployeeByEmail(email);

      if (!employee) {
        return NextResponse.json(
          {
            success: false,
            message: "找不到此 email 的員工帳號",
          },
          { status: 401 }
        );
      }

      // 驗證密碼
      if (employee.password !== password) {
        return NextResponse.json(
          {
            success: false,
            message: "密碼錯誤",
          },
          { status: 401 }
        );
      }

      // 登入成功，回傳員工資訊
      return NextResponse.json({
        success: true,
        role: "employee", // 一般員工
        name: employee.name,
        email: employee.email,
        department: employee.department,
      });
    } catch (dbError) {
      console.error("資料庫查詢錯誤:", dbError);
      return NextResponse.json(
        {
          success: false,
          message: "資料庫連線錯誤，請稍後再試",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("登入 API 錯誤:", error);
    return NextResponse.json(
      {
        success: false,
        message: "登入時發生錯誤，請稍後再試",
      },
      { status: 500 }
    );
  }
}
