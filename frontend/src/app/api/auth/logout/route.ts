import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ success: true });

  res.cookies.set('gymsmart_token', '', { httpOnly: true, maxAge: 0, path: '/' });
  res.cookies.set('gymsmart_user', '', { httpOnly: false, maxAge: 0, path: '/' });

  return res;
}
