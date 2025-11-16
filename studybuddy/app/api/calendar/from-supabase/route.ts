import { NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { getEventsForMonth } from "@/utils/google/calendar"

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (userError && sessionError) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    let googleAccessToken: string | undefined;

    if (session && (session as any).provider_token) {
      googleAccessToken = (session as any).provider_token;
    }

    if (!googleAccessToken && session?.access_token && (session as any).provider === 'google') {
      googleAccessToken = session.access_token;
    }

    if (!googleAccessToken && user?.identities) {
      const googleIdentity = user.identities.find(identity => identity.provider === 'google') as any;
      googleAccessToken = googleIdentity?.access_token ||
                         googleIdentity?.provider_data?.access_token ||
                         googleIdentity?.identity_data?.access_token;
    }

    if (!googleAccessToken) {
      console.log('No Google access token found. Session:', (session as any)?.provider, 'User identities:', user?.identities?.length)
      return new Response(JSON.stringify({
        error: "Google Calendar access not available. Please ensure you've granted calendar permissions during OAuth setup.",
        details: "The Google Calendar API needs to be enabled and proper scopes configured"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    console.log('Found Google access token, fetching calendar events...')
    const events = await getEventsForMonth(googleAccessToken)

    return new Response(JSON.stringify({ events }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    console.error('Calendar API error:', err)
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }


    return new Response(JSON.stringify({ success: true, message: "External events synced" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (userError && sessionError) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    let googleAccessToken: string | undefined;

    if ((session as any)?.provider_token) {
      googleAccessToken = (session as any).provider_token;
    }

    if (!googleAccessToken && session?.access_token && (session as any)?.provider === 'google') {
      googleAccessToken = session.access_token;
    }

    if (!googleAccessToken && user?.identities && user.identities.length > 0) {
      const googleIdentity = user.identities.find(identity => identity.provider === 'google') as any;
      if (googleIdentity) {
        googleAccessToken = googleIdentity?.provider_data?.access_token ||
                           googleIdentity?.identity_data?.access_token ||
                           googleIdentity?.access_token;
      }
    }

    if (!googleAccessToken) {
      console.log('No Google access token found for POST. Session:', (session as any)?.provider, 'User identities:', user?.identities?.length)
      return new Response(JSON.stringify({
        error: "Google Calendar access not available. Please sign in with Google and ensure Calendar permissions are granted.",
        details: "Google Calendar API may not be enabled or OAuth scopes may be missing"
      }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { title, start, end, isStudySession, examId } = await req.json()

    if (!title || !start || !end) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const eventData: any = {
      summary: title,
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }

    if (isStudySession) {
      eventData.extendedProperties = {
        private: {
          source: 'studybuddy',
          type: 'study-session',
          examId: examId || ''
        }
      }
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${googleAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      return new Response(JSON.stringify({ error: errorData.error?.message || 'Failed to create event' }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const createdEvent = await response.json()

    return new Response(JSON.stringify({
      event: {
        id: createdEvent.id,
        summary: createdEvent.summary,
        start: createdEvent.start,
        end: createdEvent.end,
      }
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
