import { NextResponse } from 'next/server';
import { addLeaveRequest, getFirstEmployee, upsertDemoDataIfEmpty } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    await upsertDemoDataIfEmpty();
    const url = new URL(request.url);
    let email = url.searchParams.get('email') || '';
    if (!email) {
      const first = await getFirstEmployee();
      if (!first) return NextResponse.json({ success: false, message: 'No employee' }, { status: 400 });
      email = first.email;
    }

    const { date, period, type, days, reason } = await request.json();

    if (!date || !period || !type || !days || !reason) {
      return NextResponse.json({ success: false, message: '缺少必要欄位' }, { status: 400 });
    }

    await addLeaveRequest({
      employee_email: email,
      date,
      period,
      type,
      days: String(days),
      reason,
      status: 'pending',
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server Error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
} 