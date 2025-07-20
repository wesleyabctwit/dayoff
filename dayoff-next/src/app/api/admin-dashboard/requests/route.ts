import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    requests: [
      { id: 1, employee: '張小明', date: '2024-01-28', type: '特休', days: 1, status: 'pending' },
      { id: 2, employee: '李小華', date: '2024-01-29', type: '病假', days: 0.5, status: 'pending' }
    ]
  });
} 