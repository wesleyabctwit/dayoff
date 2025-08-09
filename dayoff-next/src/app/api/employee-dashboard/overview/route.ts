import { NextResponse } from 'next/server';
import { findEmployeeByEmail, getFirstEmployee, upsertDemoDataIfEmpty } from '@/lib/sheets';

export async function GET(request: Request) {
  try {
    await upsertDemoDataIfEmpty();
    const url = new URL(request.url);
    const emailParam = url.searchParams.get('email');
    const employee = emailParam
      ? await findEmployeeByEmail(emailParam)
      : await getFirstEmployee();

    if (!employee) {
      return NextResponse.json({ message: 'No employee found' }, { status: 404 });
    }

    return NextResponse.json({
      balance: { annual: Number(employee.annualLeave || '0'), sick: Number(employee.sickLeave || '0') },
      profile: { name: employee.name, email: employee.email, hireDate: employee.hireDate },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
} 