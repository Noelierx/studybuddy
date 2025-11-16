import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Exam } from "@/lib/database.types";

export async function GET(req: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = await createClient();
    const { data: session } = await supabase.auth.getSession();

    if (!session || !session.session || !session.session.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized or malformed session', session }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = session.session.user.id
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User id missing from session', session }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('due_date', { ascending: true });

    if (error) {
      return new Response(JSON.stringify({ error: error.message, details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ exams }), {
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
    const { title, subject, description, due_date, priority, difficulty, estimated_hours } = body;

    if (!title || !subject || !due_date || priority === undefined || difficulty === undefined || estimated_hours === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const newExam: Omit<Exam, 'id' | 'created_at' | 'updated_at'> = {
      user_id: session.session.user.id,
      title,
      subject,
      description: description || '',
      due_date,
      priority: Math.max(1, Math.min(5, priority)),
      difficulty: Math.max(1, Math.min(5, difficulty)),
      estimated_hours: Math.max(0, estimated_hours),
      status: 'active',
    };

    const { data: exam, error } = await supabase
      .from('exams')
      .insert(newExam)
      .select()
      .single();

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ exam }), {
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
