import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    stats: {
      totalEmployees: 2,
      pendingRequests: 2,
      leavesThisMonth: 5,
      annualLeaveUsage: '65%'
    },
    activities: [
      { time: '2024-01-25 14:30', employee: '張小明', action: '提交請假申請', status: 'pending' },
      { time: '2024-01-25 10:15', employee: '李小華', action: '提交請假申請', status: 'pending' },
      { time: '2024-01-24 16:45', employee: '張小明', action: '請假申請已核准', status: 'approved' }
    ]
  });
} 