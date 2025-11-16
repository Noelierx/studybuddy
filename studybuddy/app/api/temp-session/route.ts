import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // For now, return a fake session - this would need proper Firebase auth verification
    return new Response(JSON.stringify({ user: { id: 'firebase-user-id' } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
