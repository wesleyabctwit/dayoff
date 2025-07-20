import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    employees: [
      { name: '張小明', email: 'ming@company.com', hireDate: '2023-01-15', department: '技術部', annualLeave: 14, compensatoryLeave: 3, notes: '' },
      { name: '李小華', email: 'hua@company.com', hireDate: '2022-08-01', department: '行銷部', annualLeave: 10, compensatoryLeave: 0, notes: '兼職' }
    ]
  });
} 