import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { JWT } from "google-auth-library";

const SHEET_ID = process.env.GOOGLE_SHEET_ID as string;
const SERVICE_ACCOUNT_EMAIL = process.env
  .GOOGLE_SERVICE_ACCOUNT_EMAIL as string;
const SERVICE_ACCOUNT_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
  ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n")
  : "";

export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  password: string; // 新增密碼欄位
  hireDate: string;
  department?: string;
  // 各種假別的天數設定
  特休?: string; // 特休總天數
  補休?: string; // 補休總天數
  事假?: string; // 事假總天數
  病假?: string; // 病假總天數
  喪假?: string; // 喪假總天數
  育嬰假?: string; // 育嬰假總天數
  產假?: string; // 產假總天數
  婚假?: string; // 婚假總天數
  // 各種假別的剩餘天數
  剩餘特休?: string; // 特休剩餘天數
  剩餘補休?: string; // 補休剩餘天數
  剩餘事假?: string; // 事假剩餘天數
  剩餘病假?: string; // 病假剩餘天數
  剩餘喪假?: string; // 喪假剩餘天數
  剩餘育嬰假?: string; // 育嬰假剩餘天數
  剩餘產假?: string; // 產假剩餘天數
  剩餘婚假?: string; // 婚假剩餘天數
  notes?: string;
};

export type LeaveRequestRow = {
  id: string;
  employee_email: string;
  date: string;
  period: string; // 全天/上午/下午
  type: string; // 特休/補休/事假/病假...
  days: string; // 數字字串
  reason: string;
  status: string; // pending/approved/rejected
  created_at?: string;
  updated_at?: string;
};

export type OvertimeActivityRow = {
  id: string;
  name: string; // 活動名稱
  date: string; // 活動日期
  hours: string; // 補休時數
  participants: string; // 參與員工 email，用逗號分隔
  description?: string; // 活動描述
  created_at?: string;
  updated_at?: string;
};

const EMPLOYEES_SHEET_TITLE = "employees";
const EMPLOYEES_HEADERS: Array<keyof EmployeeRow> = [
  "id",
  "name",
  "email",
  "password", // 新增密碼欄位
  "hireDate",
  "department",
  // 各種假別的天數設定
  "特休",
  "補休",
  "事假",
  "病假",
  "喪假",
  "育嬰假",
  "產假",
  "婚假",
  // 各種假別的剩餘天數
  "剩餘特休",
  "剩餘補休",
  "剩餘事假",
  "剩餘病假",
  "剩餘喪假",
  "剩餘育嬰假",
  "剩餘產假",
  "剩餘婚假",
  "notes",
];

const LEAVE_REQUESTS_SHEET_TITLE = "leave_requests";
const LEAVE_REQUESTS_HEADERS: Array<keyof LeaveRequestRow> = [
  "id",
  "employee_email",
  "date",
  "period",
  "type",
  "days",
  "reason",
  "status",
  "created_at",
  "updated_at",
];

const OVERTIME_ACTIVITIES_SHEET_TITLE = "overtime_activities";
const OVERTIME_ACTIVITIES_HEADERS: Array<keyof OvertimeActivityRow> = [
  "id",
  "name",
  "date",
  "hours",
  "participants",
  "description",
  "created_at",
  "updated_at",
];

let cachedDoc: GoogleSpreadsheet | null = null;

function safeGet(row: GoogleSpreadsheetRow, key: string): string {
  const maybeGetter = (row as unknown as { get?: (k: string) => unknown }).get;
  const value =
    typeof maybeGetter === "function"
      ? maybeGetter.call(row, key)
      : (row as unknown as Record<string, unknown>)[key];
  if (value == null) return "";
  return typeof value === "string" ? value : String(value);
}

async function getDoc(): Promise<GoogleSpreadsheet> {
  if (cachedDoc) return cachedDoc;
  if (!SHEET_ID || !SERVICE_ACCOUNT_EMAIL || !SERVICE_ACCOUNT_PRIVATE_KEY) {
    throw new Error(
      "Missing Google Sheets credentials. Please set GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY"
    );
  }

  try {
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
    cachedDoc = doc;
    return doc;
  } catch (error) {
    console.error("Google Sheets authentication error:", error);
    throw new Error(
      `Google Sheets authentication failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

async function ensureSheet(
  title: string,
  headerValues: string[]
): Promise<GoogleSpreadsheetWorksheet> {
  const doc = await getDoc();
  const existing = doc.sheetsByTitle[title];
  if (existing) return existing;
  const sheet = await doc.addSheet({ title, headerValues });
  return sheet;
}

async function getEmployeesSheet(): Promise<GoogleSpreadsheetWorksheet> {
  return ensureSheet(EMPLOYEES_SHEET_TITLE, EMPLOYEES_HEADERS as string[]);
}

async function getLeaveRequestsSheet(): Promise<GoogleSpreadsheetWorksheet> {
  return ensureSheet(
    LEAVE_REQUESTS_SHEET_TITLE,
    LEAVE_REQUESTS_HEADERS as string[]
  );
}

async function getOvertimeActivitiesSheet(): Promise<GoogleSpreadsheetWorksheet> {
  return ensureSheet(
    OVERTIME_ACTIVITIES_SHEET_TITLE,
    OVERTIME_ACTIVITIES_HEADERS as string[]
  );
}

export async function readEmployees(): Promise<EmployeeRow[]> {
  const sheet = await getEmployeesSheet();

  // 載入表頭
  await sheet.loadHeaderRow();

  // 確保表頭存在
  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(EMPLOYEES_HEADERS as string[]);
    return []; // 沒有資料時回傳空陣列
  }

  const rows = await sheet.getRows<EmployeeRow>();
  return rows.map((r) => ({
    id: safeGet(r, "id"),
    name: safeGet(r, "name"),
    email: safeGet(r, "email"),
    password: safeGet(r, "password"), // 新增密碼欄位
    hireDate: safeGet(r, "hireDate"),
    department: safeGet(r, "department"),
    // 各種假別的天數設定
    特休: safeGet(r, "特休"),
    補休: safeGet(r, "補休"),
    事假: safeGet(r, "事假"),
    病假: safeGet(r, "病假"),
    喪假: safeGet(r, "喪假"),
    育嬰假: safeGet(r, "育嬰假"),
    產假: safeGet(r, "產假"),
    婚假: safeGet(r, "婚假"),
    // 各種假別的剩餘天數
    剩餘特休: safeGet(r, "剩餘特休"),
    剩餘補休: safeGet(r, "剩餘補休"),
    剩餘事假: safeGet(r, "剩餘事假"),
    剩餘病假: safeGet(r, "剩餘病假"),
    剩餘喪假: safeGet(r, "剩餘喪假"),
    剩餘育嬰假: safeGet(r, "剩餘育嬰假"),
    剩餘產假: safeGet(r, "剩餘產假"),
    剩餘婚假: safeGet(r, "剩餘婚假"),
    notes: safeGet(r, "notes"),
  }));
}

export async function getFirstEmployee(): Promise<EmployeeRow | null> {
  const employees = await readEmployees();
  return employees.length > 0 ? employees[0] : null;
}

export async function findEmployeeByEmail(
  email: string
): Promise<EmployeeRow | null> {
  const employees = await readEmployees();
  return (
    employees.find(
      (e) => (e.email || "").toLowerCase() === email.toLowerCase()
    ) || null
  );
}

async function getNextId(sheet: GoogleSpreadsheetWorksheet): Promise<number> {
  const rows = await sheet.getRows<LeaveRequestRow>();
  let maxId = 0;
  for (const r of rows) {
    const idStr = safeGet(r as unknown as GoogleSpreadsheetRow, "id");
    const id = parseInt(idStr || "0", 10);
    if (!Number.isNaN(id)) maxId = Math.max(maxId, id);
  }
  return maxId + 1;
}

export async function readLeaveRequests(): Promise<LeaveRequestRow[]> {
  const sheet = await getLeaveRequestsSheet();

  // 載入表頭
  await sheet.loadHeaderRow();

  // 確保表頭存在
  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(LEAVE_REQUESTS_HEADERS as string[]);
    return []; // 沒有資料時回傳空陣列
  }

  const rows = await sheet.getRows<LeaveRequestRow>();
  return rows.map((r) => ({
    id: safeGet(r, "id"),
    employee_email: safeGet(r, "employee_email"),
    date: safeGet(r, "date"),
    period: safeGet(r, "period"),
    type: safeGet(r, "type"),
    days: safeGet(r, "days"),
    reason: safeGet(r, "reason"),
    status: safeGet(r, "status"),
    created_at: safeGet(r, "created_at"),
    updated_at: safeGet(r, "updated_at"),
  }));
}

export async function readLeaveHistoryByEmail(
  email: string
): Promise<LeaveRequestRow[]> {
  const all = await readLeaveRequests();
  return all.filter(
    (r) => (r.employee_email || "").toLowerCase() === email.toLowerCase()
  );
}

export async function addLeaveRequest(
  partial: Omit<
    LeaveRequestRow,
    "id" | "status" | "created_at" | "updated_at"
  > & {
    status?: string;
  }
): Promise<LeaveRequestRow> {
  const sheet = await getLeaveRequestsSheet();

  // 載入表頭
  await sheet.loadHeaderRow();

  // 確保表頭存在
  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(LEAVE_REQUESTS_HEADERS as string[]);
  }

  const id = await getNextId(sheet);
  const nowIso = new Date().toISOString();
  const status = partial.status || "pending";
  const row: LeaveRequestRow = {
    id: String(id),
    employee_email: partial.employee_email,
    date: partial.date,
    period: partial.period,
    type: partial.type,
    days: partial.days,
    reason: partial.reason,
    status,
    created_at: nowIso,
    updated_at: "",
  };
  await sheet.addRow(row as unknown as Record<string, string>);
  return row;
}

export async function updateLeaveRequestStatus(
  id: string,
  status: "pending" | "approved" | "rejected" | string
): Promise<LeaveRequestRow | null> {
  const sheet = await getLeaveRequestsSheet();
  const rows = await sheet.getRows<LeaveRequestRow>();
  const row = rows.find((r) => safeGet(r, "id") === id);

  if (row) {
    row.set("status", status);
    row.set("updated_at", new Date().toISOString());
    await row.save();
    return {
      id: safeGet(row, "id"),
      employee_email: safeGet(row, "employee_email"),
      date: safeGet(row, "date"),
      period: safeGet(row, "period"),
      type: safeGet(row, "type"),
      days: safeGet(row, "days"),
      reason: safeGet(row, "reason"),
      status: safeGet(row, "status"),
      created_at: safeGet(row, "created_at"),
      updated_at: safeGet(row, "updated_at"),
    };
  }
  return null;
}

export async function getLeaveRequestById(
  id: string
): Promise<LeaveRequestRow | null> {
  const sheet = await getLeaveRequestsSheet();
  const rows = await sheet.getRows<LeaveRequestRow>();
  const row = rows.find((r) => safeGet(r, "id") === id);
  if (!row) return null;
  return {
    id: safeGet(row, "id"),
    employee_email: safeGet(row, "employee_email"),
    date: safeGet(row, "date"),
    period: safeGet(row, "period"),
    type: safeGet(row, "type"),
    days: safeGet(row, "days"),
    reason: safeGet(row, "reason"),
    status: safeGet(row, "status"),
    created_at: safeGet(row, "created_at"),
    updated_at: safeGet(row, "updated_at"),
  };
}

export async function updateEmployeeRemainingDays(
  email: string,
  leaveType: string,
  usedDays: number
): Promise<EmployeeRow | null> {
  const sheet = await getEmployeesSheet();
  const rows = await sheet.getRows<EmployeeRow>();
  const row = rows.find((r) => safeGet(r, "email") === email);

  if (row) {
    const remainingField = `剩餘${leaveType}`;
    const currentRemaining = Number(safeGet(row, remainingField) || "0");
    const newRemaining = Math.max(0, currentRemaining - usedDays);

    row.set(remainingField as keyof EmployeeRow, String(newRemaining));
    await row.save();

    return {
      id: safeGet(row, "id"),
      name: safeGet(row, "name"),
      email: safeGet(row, "email"),
      password: safeGet(row, "password"),
      hireDate: safeGet(row, "hireDate"),
      department: safeGet(row, "department"),
      特休: safeGet(row, "特休"),
      補休: safeGet(row, "補休"),
      事假: safeGet(row, "事假"),
      病假: safeGet(row, "病假"),
      喪假: safeGet(row, "喪假"),
      育嬰假: safeGet(row, "育嬰假"),
      產假: safeGet(row, "產假"),
      婚假: safeGet(row, "婚假"),
      剩餘特休: safeGet(row, "剩餘特休"),
      剩餘補休: safeGet(row, "剩餘補休"),
      剩餘事假: safeGet(row, "剩餘事假"),
      剩餘病假: safeGet(row, "剩餘病假"),
      剩餘喪假: safeGet(row, "剩餘喪假"),
      剩餘育嬰假: safeGet(row, "剩餘育嬰假"),
      剩餘產假: safeGet(row, "剩餘產假"),
      剩餘婚假: safeGet(row, "剩餘婚假"),
      notes: safeGet(row, "notes"),
    };
  }
  return null;
}

export async function restoreEmployeeRemainingDays(
  email: string,
  leaveType: string,
  restoredDays: number
): Promise<EmployeeRow | null> {
  const sheet = await getEmployeesSheet();
  const rows = await sheet.getRows<EmployeeRow>();
  const row = rows.find((r) => safeGet(r, "email") === email);

  if (row) {
    const remainingField = `剩餘${leaveType}`;
    const currentRemaining = Number(safeGet(row, remainingField) || "0");
    const newRemaining = currentRemaining + Math.max(0, restoredDays);

    row.set(remainingField as keyof EmployeeRow, String(newRemaining));
    await row.save();

    return {
      id: safeGet(row, "id"),
      name: safeGet(row, "name"),
      email: safeGet(row, "email"),
      password: safeGet(row, "password"),
      hireDate: safeGet(row, "hireDate"),
      department: safeGet(row, "department"),
      特休: safeGet(row, "特休"),
      補休: safeGet(row, "補休"),
      事假: safeGet(row, "事假"),
      病假: safeGet(row, "病假"),
      喪假: safeGet(row, "喪假"),
      育嬰假: safeGet(row, "育嬰假"),
      產假: safeGet(row, "產假"),
      婚假: safeGet(row, "婚假"),
      剩餘特休: safeGet(row, "剩餘特休"),
      剩餘補休: safeGet(row, "剩餘補休"),
      剩餘事假: safeGet(row, "剩餘事假"),
      剩餘病假: safeGet(row, "剩餘病假"),
      剩餘喪假: safeGet(row, "剩餘喪假"),
      剩餘育嬰假: safeGet(row, "剩餘育嬰假"),
      剩餘產假: safeGet(row, "剩餘產假"),
      剩餘婚假: safeGet(row, "剩餘婚假"),
      notes: safeGet(row, "notes"),
    };
  }
  return null;
}

export async function updateEmployee(
  email: string,
  updates: Partial<Omit<EmployeeRow, "id" | "email">>
): Promise<EmployeeRow | null> {
  const sheet = await getEmployeesSheet();
  const rows = await sheet.getRows<EmployeeRow>();
  const row = rows.find((r) => safeGet(r, "email") === email);

  if (row) {
    // 更新允許修改的欄位
    if (updates.name) row.set("name", updates.name);
    if (updates.password) row.set("password", updates.password);
    if (updates.hireDate) row.set("hireDate", updates.hireDate);
    if (updates.department) row.set("department", updates.department);
    if (updates.notes) row.set("notes", updates.notes);

    await row.save();

    return {
      id: safeGet(row, "id"),
      name: safeGet(row, "name"),
      email: safeGet(row, "email"),
      password: safeGet(row, "password"),
      hireDate: safeGet(row, "hireDate"),
      department: safeGet(row, "department"),
      特休: safeGet(row, "特休"),
      補休: safeGet(row, "補休"),
      事假: safeGet(row, "事假"),
      病假: safeGet(row, "病假"),
      喪假: safeGet(row, "喪假"),
      育嬰假: safeGet(row, "育嬰假"),
      產假: safeGet(row, "產假"),
      婚假: safeGet(row, "婚假"),
      剩餘特休: safeGet(row, "剩餘特休"),
      剩餘補休: safeGet(row, "剩餘補休"),
      剩餘事假: safeGet(row, "剩餘事假"),
      剩餘病假: safeGet(row, "剩餘病假"),
      剩餘喪假: safeGet(row, "剩餘喪假"),
      剩餘育嬰假: safeGet(row, "剩餘育嬰假"),
      剩餘產假: safeGet(row, "剩餘產假"),
      剩餘婚假: safeGet(row, "剩餘婚假"),
      notes: safeGet(row, "notes"),
    };
  }
  return null;
}

export async function addEmployee(
  partial: Omit<EmployeeRow, "id">
): Promise<EmployeeRow> {
  const sheet = await getEmployeesSheet();

  // 確保表頭存在
  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(EMPLOYEES_HEADERS as string[]);
  }

  const employees = await sheet.getRows<EmployeeRow>();
  let maxId = 0;
  for (const r of employees) {
    const idStr = safeGet(r as unknown as GoogleSpreadsheetRow, "id");
    const id = parseInt(idStr || "0", 10);
    if (!Number.isNaN(id)) maxId = Math.max(maxId, id);
  }
  const newId = maxId + 1;

  const row: EmployeeRow = {
    id: String(newId),
    name: partial.name,
    email: partial.email,
    password: partial.password, // 新增密碼欄位
    hireDate: partial.hireDate,
    department: partial.department,
    // 各種假別的天數設定
    特休: partial.特休,
    補休: partial.補休,
    事假: partial.事假,
    病假: partial.病假,
    喪假: partial.喪假,
    育嬰假: partial.育嬰假,
    產假: partial.產假,
    婚假: partial.婚假,
    // 各種假別的剩餘天數（初始化時等於總天數）
    剩餘特休: partial.剩餘特休 || partial.特休,
    剩餘補休: partial.剩餘補休 || partial.補休,
    剩餘事假: partial.剩餘事假 || partial.事假,
    剩餘病假: partial.剩餘病假 || partial.病假,
    剩餘喪假: partial.剩餘喪假 || partial.喪假,
    剩餘育嬰假: partial.剩餘育嬰假 || partial.育嬰假,
    剩餘產假: partial.剩餘產假 || partial.產假,
    剩餘婚假: partial.剩餘婚假 || partial.婚假,
    notes: partial.notes,
  };
  await sheet.addRow(row as unknown as Record<string, string>);
  return row;
}

export async function calculateUsedLeaveDays(
  email: string,
  year: number = new Date().getFullYear()
): Promise<{
  特休: number;
  補休: number;
  事假: number;
  病假: number;
  喪假: number;
  育嬰假: number;
  產假: number;
  婚假: number;
}> {
  const leaveHistory = await readLeaveHistoryByEmail(email);
  const currentYear = year;

  const usedDays = {
    特休: 0,
    補休: 0,
    事假: 0,
    病假: 0,
    喪假: 0,
    育嬰假: 0,
    產假: 0,
    婚假: 0,
  };

  for (const request of leaveHistory) {
    // 只計算已核准的請假申請
    if (request.status !== "approved") continue;

    // 檢查請假日期是否在指定年份
    const requestDate = new Date(request.date);
    if (requestDate.getFullYear() !== currentYear) continue;

    const days = parseFloat(request.days || "0");
    const leaveType = request.type as keyof typeof usedDays;

    if (leaveType in usedDays) {
      usedDays[leaveType] += days;
    }
  }

  return usedDays;
}

// 讀取所有活動加班記錄
export async function readOvertimeActivities(): Promise<OvertimeActivityRow[]> {
  const sheet = await getOvertimeActivitiesSheet();

  // 載入表頭
  await sheet.loadHeaderRow();

  // 確保表頭存在
  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(OVERTIME_ACTIVITIES_HEADERS as string[]);
    return []; // 沒有資料時回傳空陣列
  }

  const rows = await sheet.getRows<OvertimeActivityRow>();
  return rows.map((r) => ({
    id: safeGet(r, "id"),
    name: safeGet(r, "name"),
    date: safeGet(r, "date"),
    hours: safeGet(r, "hours"),
    participants: safeGet(r, "participants"),
    description: safeGet(r, "description"),
    created_at: safeGet(r, "created_at"),
    updated_at: safeGet(r, "updated_at"),
  }));
}

// 根據 ID 取得活動加班記錄
export async function getOvertimeActivityById(
  id: string
): Promise<OvertimeActivityRow | null> {
  const sheet = await getOvertimeActivitiesSheet();
  const rows = await sheet.getRows<OvertimeActivityRow>();
  const row = rows.find((r) => safeGet(r, "id") === id);
  if (!row) return null;
  return {
    id: safeGet(row, "id"),
    name: safeGet(row, "name"),
    date: safeGet(row, "date"),
    hours: safeGet(row, "hours"),
    participants: safeGet(row, "participants"),
    description: safeGet(row, "description"),
    created_at: safeGet(row, "created_at"),
    updated_at: safeGet(row, "updated_at"),
  };
}

// 新增活動加班記錄
export async function addOvertimeActivity(
  partial: Omit<OvertimeActivityRow, "id" | "created_at" | "updated_at">
): Promise<OvertimeActivityRow> {
  const sheet = await getOvertimeActivitiesSheet();

  // 載入表頭
  await sheet.loadHeaderRow();

  // 確保表頭存在
  if (!sheet.headerValues || sheet.headerValues.length === 0) {
    await sheet.setHeaderRow(OVERTIME_ACTIVITIES_HEADERS as string[]);
  }

  const rows = await sheet.getRows<OvertimeActivityRow>();
  let maxId = 0;
  for (const r of rows) {
    const idStr = safeGet(r as unknown as GoogleSpreadsheetRow, "id");
    const id = parseInt(idStr || "0", 10);
    if (!Number.isNaN(id)) maxId = Math.max(maxId, id);
  }
  const newId = maxId + 1;

  const nowIso = new Date().toISOString();
  const row: OvertimeActivityRow = {
    id: String(newId),
    name: partial.name,
    date: partial.date,
    hours: partial.hours,
    participants: partial.participants,
    description: partial.description || "",
    created_at: nowIso,
    updated_at: "",
  };
  await sheet.addRow(row as unknown as Record<string, string>);
  return row;
}

// 更新活動加班記錄
export async function updateOvertimeActivity(
  id: string,
  updates: Partial<Omit<OvertimeActivityRow, "id" | "created_at">>
): Promise<OvertimeActivityRow | null> {
  const sheet = await getOvertimeActivitiesSheet();
  const rows = await sheet.getRows<OvertimeActivityRow>();
  const row = rows.find((r) => safeGet(r, "id") === id);

  if (row) {
    if (updates.name !== undefined) row.set("name", updates.name);
    if (updates.date !== undefined) row.set("date", updates.date);
    if (updates.hours !== undefined) row.set("hours", updates.hours);
    if (updates.participants !== undefined)
      row.set("participants", updates.participants);
    if (updates.description !== undefined)
      row.set("description", updates.description);
    row.set("updated_at", new Date().toISOString());
    await row.save();

    return {
      id: safeGet(row, "id"),
      name: safeGet(row, "name"),
      date: safeGet(row, "date"),
      hours: safeGet(row, "hours"),
      participants: safeGet(row, "participants"),
      description: safeGet(row, "description"),
      created_at: safeGet(row, "created_at"),
      updated_at: safeGet(row, "updated_at"),
    };
  }
  return null;
}

// 刪除活動加班記錄
export async function deleteOvertimeActivity(id: string): Promise<boolean> {
  const sheet = await getOvertimeActivitiesSheet();
  const rows = await sheet.getRows<OvertimeActivityRow>();
  const row = rows.find((r) => safeGet(r, "id") === id);

  if (row) {
    await row.delete();
    return true;
  }
  return false;
}

// 為多個員工增加剩餘補休時數
export async function addCompensatoryHoursToEmployees(
  emails: string[],
  hours: number
): Promise<void> {
  const sheet = await getEmployeesSheet();
  const rows = await sheet.getRows<EmployeeRow>();

  for (const email of emails) {
    const row = rows.find((r) => safeGet(r, "email") === email);
    if (row) {
      const currentRemaining = Number(safeGet(row, "剩餘補休") || "0");
      const newRemaining = currentRemaining + hours;
      row.set("剩餘補休", String(newRemaining));
      await row.save();
    }
  }
}

// 為多個員工減少剩餘補休時數
export async function subtractCompensatoryHoursFromEmployees(
  emails: string[],
  hours: number
): Promise<void> {
  const sheet = await getEmployeesSheet();
  const rows = await sheet.getRows<EmployeeRow>();

  for (const email of emails) {
    const row = rows.find((r) => safeGet(r, "email") === email);
    if (row) {
      const currentRemaining = Number(safeGet(row, "剩餘補休") || "0");
      const newRemaining = Math.max(0, currentRemaining - hours);
      row.set("剩餘補休", String(newRemaining));
      await row.save();
    }
  }
}
