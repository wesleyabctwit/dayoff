import { NextResponse } from 'next/server';
import { readEmployees, readLeaveRequests, upsertDemoDataIfEmpty, LeaveRequestRow, EmployeeRow } from '@/lib/sheets';

export async function GET() {
  try {
    await upsertDemoDataIfEmpty();
    const [employees, requests] = await Promise.all([readEmployees(), readLeaveRequests()]);

    const totalEmployees = employees.length;
    const pendingRequests = requests.filter((r: LeaveRequestRow) => r.status === 'pending').length;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const leavesThisMonth = requests.filter((r: LeaveRequestRow) => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;

    // 粗略估算年休使用率：已核准請假天數 / (員工數 * 14) 假設每人 14 天特休
    const approvedDays = requests
      .filter((r: LeaveRequestRow) => r.status === 'approved')
      .reduce((sum: number, r: LeaveRequestRow) => sum + (parseFloat(r.days || '0') || 0), 0);
    const denom = Math.max(1, totalEmployees * 14);
    const annualLeaveUsage = `${Math.round((approvedDays / denom) * 100)}%`;

    // 活動流：取最近 3 筆依 created_at 或 date 排序
    const sorted = [...requests].sort((a, b) => {
      const ad = new Date(a.created_at || a.date).getTime();
      const bd = new Date(b.created_at || b.date).getTime();
      return bd - ad;
    }).slice(0, 3);

    const emailToName = new Map(employees.map((e: EmployeeRow) => [e.email, e.name] as const));

    const activities = sorted.map((r: LeaveRequestRow) => ({
      time: new Date(r.created_at || r.date).toISOString().replace('T', ' ').slice(0, 16),
      employee: emailToName.get(r.employee_email) || r.employee_email,
      action: r.status === 'approved' ? '請假申請已核准' : '提交請假申請',
      status: r.status,
    }));

    return NextResponse.json({
      stats: {
        totalEmployees,
        pendingRequests,
        leavesThisMonth,
        annualLeaveUsage,
      },
      activities,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server Error';
    return NextResponse.json({ message }, { status: 500 });
  }
} 