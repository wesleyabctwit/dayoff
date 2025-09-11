// 初始化 Google Sheets 資料表腳本
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

async function initSheets() {
  const SHEET_ID = process.env.GOOGLE_SHEET_ID;
  const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const SERVICE_ACCOUNT_PRIVATE_KEY = (
    process.env.GOOGLE_PRIVATE_KEY || ""
  ).replace(/\\n/g, "\n");

  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    console.error("缺少 Google Sheets 憑證。請檢查 .env.local");
    process.exit(1);
  }

  const auth = new JWT({
    email: SERVICE_ACCOUNT_EMAIL,
    key: SERVICE_ACCOUNT_PRIVATE_KEY,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets",
      "https://www.googleapis.com/auth/drive.file",
    ],
  });

  const doc = new GoogleSpreadsheet(SHEET_ID, auth);
  await doc.loadInfo();

  console.log(`正在初始化試算表: ${doc.title}`);

  // 建立或更新 employees 分頁
  let employeesSheet = doc.sheetsByTitle["employees"];
  if (!employeesSheet) {
    employeesSheet = await doc.addSheet({
      title: "employees",
      headerValues: [
        "id",
        "name",
        "email",
        "password",
        "hireDate",
        "department",
        "特休",
        "補休",
        "事假",
        "病假",
        "喪假",
        "育嬰假",
        "產假",
        "婚假",
        "剩餘特休",
        "剩餘補休",
        "剩餘事假",
        "剩餘病假",
        "剩餘喪假",
        "剩餘育嬰假",
        "剩餘產假",
        "剩餘婚假",
        "notes",
      ],
    });
  } else {
    // 清除現有內容並設定表頭
    await employeesSheet.clear();
    await employeesSheet.setHeaderRow([
      "id",
      "name",
      "email",
      "password",
      "hireDate",
      "department",
      "特休",
      "補休",
      "事假",
      "病假",
      "喪假",
      "育嬰假",
      "產假",
      "婚假",
      "剩餘特休",
      "剩餘補休",
      "剩餘事假",
      "剩餘病假",
      "剩餘喪假",
      "剩餘育嬰假",
      "剩餘產假",
      "剩餘婚假",
      "notes",
    ]);
  }

  // 新增示例員工資料
  await employeesSheet.addRows([
    {
      id: "1",
      name: "張小明",
      email: "ming@company.com",
      password: "123456",
      hireDate: "2023-01-15",
      department: "技術部",
      特休: "14",
      補休: "3",
      事假: "7",
      病假: "5",
      喪假: "3",
      育嬰假: "0",
      產假: "0",
      婚假: "3",
      剩餘特休: "14",
      剩餘補休: "3",
      剩餘事假: "7",
      剩餘病假: "5",
      剩餘喪假: "3",
      剩餘育嬰假: "0",
      剩餘產假: "0",
      剩餘婚假: "3",
      notes: "",
    },
    {
      id: "2",
      name: "李小華",
      email: "hua@company.com",
      password: "123456",
      hireDate: "2022-08-01",
      department: "行銷部",
      特休: "10",
      補休: "0",
      事假: "5",
      病假: "6",
      喪假: "3",
      育嬰假: "0",
      產假: "0",
      婚假: "3",
      剩餘特休: "10",
      剩餘補休: "0",
      剩餘事假: "5",
      剩餘病假: "6",
      剩餘喪假: "3",
      剩餘育嬰假: "0",
      剩餘產假: "0",
      剩餘婚假: "3",
      notes: "兼職",
    },
  ]);

  console.log("✓ employees 分頁已建立並填入示例資料");

  // 建立或更新 leave_requests 分頁
  let leaveRequestsSheet = doc.sheetsByTitle["leave_requests"];
  if (!leaveRequestsSheet) {
    leaveRequestsSheet = await doc.addSheet({
      title: "leave_requests",
      headerValues: [
        "id",
        "employee_email",
        "date",
        "period",
        "type",
        "days",
        "reason",
        "status",
        "created_at",
      ],
    });
  } else {
    // 清除現有內容並設定表頭
    await leaveRequestsSheet.clear();
    await leaveRequestsSheet.setHeaderRow([
      "id",
      "employee_email",
      "date",
      "period",
      "type",
      "days",
      "reason",
      "status",
      "created_at",
    ]);
  }

  // 刪除不需要的分頁
  const sheetsToDelete = ["overview", "leave_request"]; // 注意：leave_request 少了 s
  for (const sheetTitle of sheetsToDelete) {
    const sheet = doc.sheetsByTitle[sheetTitle];
    if (sheet) {
      await sheet.delete();
      console.log(`✓ 已刪除不需要的分頁: ${sheetTitle}`);
    }
  }

  console.log("\n🎉 Google Sheets 初始化完成！");
  console.log("資料表結構：");
  console.log("- employees: 員工基本資料與假期餘額");
  console.log("- leave_requests: 請假申請紀錄");
}

initSheets().catch(console.error);
