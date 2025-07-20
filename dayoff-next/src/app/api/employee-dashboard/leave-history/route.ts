import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    history: [
      { date: '2024-01-10', type: '特休', period: '全天', days: 1, reason: '家中有事', status: 'approved' },
      { date: '2024-01-20', type: '病假', period: '上午', days: 0.5, reason: '感冒', status: 'pending' }
    ]
  });
} 