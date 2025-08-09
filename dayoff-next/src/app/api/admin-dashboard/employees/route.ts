import { NextResponse } from 'next/server';
import { readEmployees, upsertDemoDataIfEmpty, EmployeeRow, addEmployee } from '@/lib/sheets';

export async function GET() {
  try {
    await upsertDemoDataIfEmpty();
    const employees = await readEmployees();
    return NextResponse.json({
      employees: employees.map((e: EmployeeRow) => ({
        name: e.name,
        email: e.email,
        hireDate: e.hireDate,
        department: e.department || '',
        annualLeave: Number(e.annualLeave || '0'),
        compensatoryLeave: Number(e.compensatoryLeave || '0'),
        notes: e.notes || '',
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name, email, hireDate, department, annualLeave, compensatoryLeave, notes } = await request.json();

    if (!name || !email || !hireDate || !department) {
      return NextResponse.json({ success: false, message: '缺少必要欄位' }, { status: 400 });
    }

    const newEmployee = await addEmployee({
      name,
      email,
      hireDate,
      department,
      annualLeave: String(annualLeave || 14),
      compensatoryLeave: String(compensatoryLeave || 0),
      sickLeave: '6', // 預設病假天數
      notes: notes || '',
    });

    return NextResponse.json({ success: true, employee: newEmployee });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
} 