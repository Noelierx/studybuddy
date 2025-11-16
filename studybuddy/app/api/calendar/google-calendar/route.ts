// Google Calendar API integration for modifying events

import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    error: "Use client-side for reading events"
  }, { status: 410 })
}

export async function POST() {
  return NextResponse.json({
    error: "Use client-side for creating events"
  }, { status: 410 })
}

export async function PUT(req: NextRequest) {
  try {
    const { eventId, title, startTime, endTime, accessToken } = await req.json()

    if (!eventId || !title || !startTime || !endTime || !accessToken) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating Google Calendar event:', error)
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { eventId, accessToken } = await req.json()

    if (!eventId || !accessToken) {
      return NextResponse.json({ error: "Missing eventId or accessToken" }, { status: 400 })
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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error)
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
