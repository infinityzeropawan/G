import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gymsmart_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No token found' }, { status: 404 });
  }

  return NextResponse.json({ token });
}
