import { NextResponse } from 'next/server';
import { getFirstEmployee, readLeaveHistoryByEmail, upsertDemoDataIfEmpty, LeaveRequestRow } from '@/lib/sheets';

export async function GET(request: Request) {
  try {
    await upsertDemoDataIfEmpty();
    const url = new URL(request.url);
    let email = url.searchParams.get('email') || '';
    if (!email) {
      const first = await getFirstEmployee();
      if (!first) return NextResponse.json({ history: [] });
      email = first.email;
    }
    const history = await readLeaveHistoryByEmail(email);
    const mapped = history.map((h: LeaveRequestRow) => ({
      date: h.date,
      type: h.type,
      period: h.period,
      days: Number(h.days || '0'),
      reason: h.reason,
      status: h.status,
    }));
    return NextResponse.json({ history: mapped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
} 