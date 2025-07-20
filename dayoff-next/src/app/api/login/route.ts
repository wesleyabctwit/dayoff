import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  // 範例帳號密碼（可自行修改）
  const users = [
    { email: 'ming@company.com', password: '123456', role: 'employee', name: '張小明' },
    { email: 'admin@company.com', password: 'admin123', role: 'admin', name: '管理員' },
  ];

  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    return NextResponse.json({ success: true, role: user.role, name: user.name });
  } else {
    return NextResponse.json({ success: false, message: '帳號或密碼錯誤' }, { status: 401 });
  }
} 