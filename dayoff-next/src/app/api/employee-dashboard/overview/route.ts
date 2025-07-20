import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    balance: { annual: 10, sick: 5 },
    profile: { name: '張小明', email: 'ming@company.com', hireDate: '2023-01-15' }
  });
} 