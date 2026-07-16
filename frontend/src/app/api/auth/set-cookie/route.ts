import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { token, user } = await req.json();
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 400 });

  const res = NextResponse.json({ success: true });

  res.cookies.set('gymsmart_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  res.cookies.set('gymsmart_user', JSON.stringify({ name: user?.name, email: user?.email, role: user?.role }), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return res;
}
