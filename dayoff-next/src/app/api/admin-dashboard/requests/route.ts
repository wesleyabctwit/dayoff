import { NextResponse } from 'next/server';
import { readLeaveRequests, readEmployees, upsertDemoDataIfEmpty, LeaveRequestRow, EmployeeRow } from '@/lib/sheets';

export async function GET() {
  try {
    await upsertDemoDataIfEmpty();
    const [requests, employees] = await Promise.all([readLeaveRequests(), readEmployees()]);
    const emailToName = new Map(employees.map((e: EmployeeRow) => [e.email, e.name] as const));

    const mapped = requests.map((r: LeaveRequestRow) => ({
      id: Number(r.id || '0'),
      employee: emailToName.get(r.employee_email) || r.employee_email,
      date: r.date,
      type: r.type,
      days: Number(r.days || '0'),
      status: r.status,
    }));

    return NextResponse.json({ requests: mapped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
} 