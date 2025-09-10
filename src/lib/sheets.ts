import {
  GoogleSpreadsheet,
  GoogleSpreadsheetRow,
  GoogleSpreadsheetWorksheet,
} from "google-spreadsheet";
import { JWT } from "google-auth-library";

const SHEET_ID = process.env.GOOGLE_SHEET_ID as string;
const SERVICE_ACCOUNT_EMAIL = process.env
  .GOOGLE_SERVICE_ACCOUNT_EMAIL as string;
const SERVICE_ACCOUNT_PRIVATE_KEY = (
  process.env.GOOGLE_PRIVATE_KEY || ""
).replace(/\\n/g, "\n");

export type EmployeeRow = {
  id: string;
  name: string;
  email: string;
  password: string; // 新增密碼欄位
  hireDate: string;
  department?: string;
  annualLeave?: string; // 特休剩餘天數
  compensatoryLeave?: string; // 補休剩餘天數
  sickLeave?: string; // 病假剩餘天數
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

const EMPLOYEES_SHEET_TITLE = "employees";
const EMPLOYEES_HEADERS: Array<keyof EmployeeRow> = [
  "id",
  "name",
  "email",
  "password", // 新增密碼欄位
  "hireDate",
  "department",
  "annualLeave",
  "compensatoryLeave",
  "sickLeave",
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

export async function readEmployees(): Promise<EmployeeRow[]> {
  const sheet = await getEmployeesSheet();

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
    annualLeave: safeGet(r, "annualLeave"),
    compensatoryLeave: safeGet(r, "compensatoryLeave"),
    sickLeave: safeGet(r, "sickLeave"),
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
    annualLeave: partial.annualLeave,
    compensatoryLeave: partial.compensatoryLeave,
    sickLeave: partial.sickLeave,
    notes: partial.notes,
  };
  await sheet.addRow(row as unknown as Record<string, string>);
  return row;
}

export async function upsertDemoDataIfEmpty(): Promise<void> {
  // Optional helper: if sheets are empty, seed some demo rows so the UI won't be blank
  const empSheet = await getEmployeesSheet();
  const empRows = await empSheet.getRows<EmployeeRow>();
  if (empRows.length === 0) {
    const seedEmployees: EmployeeRow[] = [
      {
        id: "1",
        name: "張小明",
        email: "ming@company.com",
        password: "123456", // 新增密碼
        hireDate: "2023-01-15",
        department: "技術部",
        annualLeave: "14",
        compensatoryLeave: "3",
        sickLeave: "5",
        notes: "",
      },
      {
        id: "2",
        name: "李小華",
        email: "hua@company.com",
        password: "123456", // 新增密碼
        hireDate: "2022-08-01",
        department: "行銷部",
        annualLeave: "10",
        compensatoryLeave: "0",
        sickLeave: "6",
        notes: "兼職",
      },
    ];
    for (const r of seedEmployees) {
      // eslint-disable-next-line no-await-in-loop
      await empSheet.addRow(r as unknown as Record<string, string>);
    }
  }

  const reqSheet = await getLeaveRequestsSheet();
  const reqRows = await reqSheet.getRows<LeaveRequestRow>();
  if (reqRows.length === 0) {
    const seedRequests: LeaveRequestRow[] = [
      {
        id: "1",
        employee_email: "ming@company.com",
        date: "2024-01-10",
        period: "全天",
        type: "特休",
        days: "1",
        reason: "家中有事",
        status: "approved",
        created_at: new Date().toISOString(),
        updated_at: "",
      },
      {
        id: "2",
        employee_email: "hua@company.com",
        date: "2024-01-20",
        period: "上午",
        type: "病假",
        days: "0.5",
        reason: "感冒",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: "",
      },
    ];
    for (const r of seedRequests) {
      // eslint-disable-next-line no-await-in-loop
      await reqSheet.addRow(r as unknown as Record<string, string>);
    }
  }
}
