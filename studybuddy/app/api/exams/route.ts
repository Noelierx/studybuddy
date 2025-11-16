import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get exams from Firestore Admin
    const examsSnapshot = await adminDb.collection('exams')
      .where('user_id', '==', userId)
      .where('status', '==', 'active')
      .orderBy('due_date', 'asc')
      .get();

    const exams = examsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return new Response(JSON.stringify({ exams }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Exams GET error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, subject, description, due_date, priority, difficulty, estimated_hours, userId, googleCalendarId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!title || !subject || !due_date || priority === undefined || difficulty === undefined || estimated_hours === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newExam = {
      user_id: userId,
      title,
      subject,
      description: description || '',
      due_date,
      priority: Math.max(1, Math.min(5, priority)),
      difficulty: Math.max(1, Math.min(5, difficulty)),
      estimated_hours: Math.max(0, estimated_hours),
      status: 'active',
      google_calendar_id: googleCalendarId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add to Firestore
    const docRef = await adminDb.collection('exams').add(newExam);

    const exam = { id: docRef.id, ...newExam };

    return new Response(JSON.stringify({ exam }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Exams POST error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, subject, description, due_date, priority, difficulty, estimated_hours, userId, googleCalendarId } = body;

    if (!id || !userId) {
      return new Response(JSON.stringify({ error: "Exam ID and User ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subject !== undefined) updateData.subject = subject;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (priority !== undefined) updateData.priority = Math.max(1, Math.min(5, priority));
    if (difficulty !== undefined) updateData.difficulty = Math.max(1, Math.min(5, difficulty));
    if (estimated_hours !== undefined) updateData.estimated_hours = Math.max(0, estimated_hours);
    if (googleCalendarId !== undefined) updateData.google_calendar_id = googleCalendarId;
    updateData.updated_at = new Date().toISOString();

    // Update in Firestore
    await adminDb.collection('exams').doc(id).update(updateData);

    const updatedExam = { id, ...updateData };

    return new Response(JSON.stringify({ exam: updatedExam }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Exams PATCH error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const examId = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');

    if (!examId || !userId) {
      return new Response(JSON.stringify({ error: "Missing exam ID or user ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // First, delete all study sessions related to this exam
    const sessionsSnapshot = await adminDb.collection('study-sessions')
      .where('exam_id', '==', examId)
      .where('user_id', '==', userId)
      .get();

    const deletePromises = sessionsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // Then delete the exam from Firestore
    await adminDb.collection('exams').doc(examId).delete();

    return new Response(JSON.stringify({
      success: true,
      message: "Exam and related study sessions deleted",
      deletedSessions: sessionsSnapshot.docs.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('Exams DELETE error:', err);
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
