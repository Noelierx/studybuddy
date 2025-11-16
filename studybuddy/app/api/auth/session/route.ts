import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/firebase';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('session')?.value;

    if (!sessionCookie) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }
    return NextResponse.json({ user: { id: 'firebase-user-id' } });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }
}
