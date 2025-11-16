import { NextRequest } from "next/server"

export async function GET() {
  return new Response(JSON.stringify({
    error: "Use client-side for reading events"
  }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function POST() {
  return new Response(JSON.stringify({
    error: "Use client-side for creating events"
  }), {
    status: 410,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function PUT(req: NextRequest) {
  try {
    const { eventId, title, startTime, endTime, accessToken } = await req.json()

    if (!eventId || !title || !startTime || !endTime || !accessToken) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: title,
        start: {
          dateTime: startTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to update Google Calendar event')
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating Google Calendar event:', error)
    return new Response(JSON.stringify({ error: "Failed to update event" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { eventId, accessToken } = await req.json()

    if (!eventId || !accessToken) {
      return new Response(JSON.stringify({ error: "Missing eventId or accessToken" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to delete Google Calendar event')
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error)
    return new Response(JSON.stringify({ error: "Failed to delete event" }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
