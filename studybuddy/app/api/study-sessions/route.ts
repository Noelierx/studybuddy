import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const examId = searchParams.get('exam_id');

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let query = adminDb.collection('study-sessions')
      .where('user_id', '==', userId);

    if (examId) {
      query = query.where('exam_id', '==', examId);
    }

    const sessionsSnapshot = await query.orderBy('scheduled_start', 'desc').get();

    const sessions = sessionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return new Response(JSON.stringify({ sessions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Study sessions GET error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, exam_id, title, scheduled_start, scheduled_end, notes } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!exam_id || !title || !scheduled_start || !scheduled_end) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newSession = {
      user_id: userId,
      exam_id,
      title,
      scheduled_start,
      scheduled_end,
      actual_start: null,
      actual_end: null,
      completed: false,
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to Firestore
    const docRef = await adminDb.collection('study-sessions').add(newSession);

    const session = { id: docRef.id, ...newSession };

    return new Response(JSON.stringify({ session }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Study sessions POST error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, completed, notes, actual_start, actual_end, userId } = body;

    if (!id || !userId) {
      return new Response(JSON.stringify({ error: "Session ID and User ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: any = {};
    if (completed !== undefined) updateData.completed = completed;
    if (notes !== undefined) updateData.notes = notes;
    if (actual_start !== undefined) updateData.actual_start = actual_start;
    if (actual_end !== undefined) updateData.actual_end = actual_end;
    updateData.updated_at = new Date().toISOString();

    // Update in Firestore
    await adminDb.collection('study-sessions').doc(id).update(updateData);

    const updatedSession = { id, ...updateData };

    return new Response(JSON.stringify({ session: updatedSession }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Study sessions PATCH error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');

    if (!sessionId || !userId) {
      return new Response(JSON.stringify({ error: "Session ID and User ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete from Firestore
    await adminDb.collection('study-sessions').doc(sessionId).delete();

    return new Response(JSON.stringify({ success: true, message: "Study session deleted" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Study sessions DELETE error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
