import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { StudySession } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { searchParams } = new URL(req.url);
    const exam_id = searchParams.get('exam_id');

    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', session.session.user.id)
      .order('scheduled_start', { ascending: false });

    if (exam_id) {
      query = query.eq('exam_id', exam_id);
    }

    const { data: sessions, error } = await query;

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ sessions: sessions || [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { exam_id, title, scheduled_start, scheduled_end, notes } = body;

    if (!exam_id || !title || !scheduled_start || !scheduled_end) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newSession: Omit<StudySession, 'id' | 'created_at' | 'updated_at'> = {
      user_id: session.session.user.id,
      exam_id,
      title,
      scheduled_start,
      scheduled_end,
      actual_start: undefined,
      actual_end: undefined,
      completed: false,
      notes: notes || '',
    };

    const { data: sessionData, error } = await supabase
      .from('study_sessions')
      .insert(newSession)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ session: sessionData }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();

    if (!session.session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { id, completed, notes, actual_start, actual_end } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: "Session ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updateData: Partial<StudySession> = {};
    if (completed !== undefined) updateData.completed = completed;
    if (notes !== undefined) updateData.notes = notes;
    if (actual_start !== undefined) updateData.actual_start = actual_start;
    if (actual_end !== undefined) updateData.actual_end = actual_end;

    const { data: sessionData, error } = await supabase
      .from('study_sessions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', session.session.user.id) // Ensure user can only update their own sessions
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ session: sessionData }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
