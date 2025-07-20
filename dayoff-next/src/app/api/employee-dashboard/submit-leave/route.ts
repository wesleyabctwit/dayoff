import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // 這裡只回傳成功，不做實際儲存
  return NextResponse.json({ success: true });
} 