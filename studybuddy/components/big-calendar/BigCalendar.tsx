"use client";

import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";
// @ts-ignore
import "react-big-calendar/lib/css/react-big-calendar.css";
// @ts-ignore
import "../shadcn-big-calendar/shadcn-big-calendar.css";
// @ts-ignore
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { Button } from "../ui/button";
import { computeStudySuggestions, computeStudySuggestionsFromExams, Exam } from "./scheduler";
import { auth } from "../../lib/firebase";
import { useToast, ToastContainer } from "../ui/toast";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

type EventItem = {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  googleId?: string;
  isGoogleEvent?: boolean;
  isStudySession?: boolean;
  isExam?: boolean;
  completed?: boolean;
};

const DnDCalendar = withDragAndDrop(Calendar) as any;

interface BigCalendarProps {
  exams: Exam[];
}

export default function BigCalendar({ exams }: BigCalendarProps) {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | number | null>(null);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [googleEventsLoaded, setGoogleEventsLoaded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedSessions, setSuggestedSessions] = useState<any[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set());

  const { toasts, success, error, info, removeToast } = useToast();

  // Convert exams to calendar events
  useEffect(() => {
    const examEvents: EventItem[] = (exams || []).map(exam => ({
      id: `exam-${exam.id}`,
      title: `${exam.title} (${exam.subject})`,
      start: new Date(exam.due_date),
      end: new Date(new Date(exam.due_date).getTime() + (60 * 60 * 1000)), // 1 hour slot from due date
      isExam: true,
      googleId: exam.google_calendar_id,
      isGoogleEvent: !!exam.google_calendar_id
    }));

    // Replace exam events and remove study sessions for deleted exams
    setEvents(prevEvents => {
      // Get current exam IDs
      const currentExamIds = new Set((exams || []).map(exam => exam.id));

      // Filter out events for deleted exams and their study sessions
      const validEvents = prevEvents.filter(event => {
        // Keep all non-exam events
        if (!event.id.toString().startsWith('exam-') && !event.isStudySession) {
          return true;
        }
        // Keep exam events for current exams
        if (event.id.toString().startsWith('exam-')) {
          const examId = event.id.toString().replace('exam-', '');
          return currentExamIds.has(examId);
        }
        // Keep study sessions that are persisted in DB (not just local calendar events)
        if (event.isStudySession && !event.id.toString().startsWith('session-')) {
          return true;
        }
        // Remove study sessions for deleted exams (local events without DB persistence)
        return false;
      });

      // Add current exam events
      return [...validEvents, ...examEvents];
    });
  }, [exams]);

  // Load Google Calendar events
  useEffect(() => {
    async function loadGoogleEvents() {
      if (googleEventsLoaded) return;

      await new Promise(resolve => setTimeout(resolve, 1000));

      const user = auth.currentUser;
      const accessToken = localStorage.getItem('googleAccessToken');

      if (user && user.providerData?.some(p => p.providerId === 'google.com') && accessToken) {
        try {
          const googleEvents = await fetchGoogleCalendarEvents();
          if (googleEvents.length > 0) {
            setEvents(prev => {
              const localEvents = prev.filter(event =>
                !event.id.toString().startsWith('google-')
              );
              return [...localEvents, ...googleEvents];
            });
          }
          setGoogleEventsLoaded(true);
        } catch (error) {
          console.error('Failed to load Google Calendar events:', error);
          setGoogleEventsLoaded(true);
        }
      } else {
        setGoogleEventsLoaded(true);
      }
    }

    loadGoogleEvents();
  }, []);

  async function fetchGoogleCalendarEvents(): Promise<EventItem[]> {
    const accessToken = localStorage.getItem('googleAccessToken');
    if (!accessToken) return [];

    const timeMin = new Date().toISOString();
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?singleEvents=true&orderBy=startTime&timeMin=${timeMin}&maxResults=250`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.items || [])
      .filter((event: any) => event.status !== 'cancelled')
      .map((event: any) => ({
        id: event.id,
        title: event.summary || '(no title)',
        start: new Date(event.start?.dateTime || event.start?.date),
        end: new Date(event.end?.dateTime || event.end?.date),
        googleId: event.id,
        isGoogleEvent: true,
      }));
  }

  async function createGoogleCalendarEvent(title: string, startTime: Date, endTime: Date) {
    const accessToken = localStorage.getItem('googleAccessToken');
    if (!accessToken) throw new Error('No access token');

    const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: title,
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      }),
    });

    if (!response.ok) throw new Error('Failed to create event');
    const result = await response.json();
    return result.id;
  }

  async function updateGoogleCalendarEvent(eventId: string, title: string, startTime: Date, endTime: Date) {
    const accessToken = localStorage.getItem('googleAccessToken');
    if (!accessToken) throw new Error('No access token');

    const response = await fetch('/api/calendar/google-calendar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        title,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        accessToken,
      }),
    });

    if (!response.ok) throw new Error('Failed to update Google Calendar event');
  }

  async function deleteGoogleCalendarEvent(eventId: string) {
    const accessToken = localStorage.getItem('googleAccessToken');
    if (!accessToken) throw new Error('No access token');

    const response = await fetch('/api/calendar/google-calendar', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        accessToken,
      }),
    });

    if (!response.ok) throw new Error('Failed to delete Google Calendar event');
  }

  function previewSuggestionsHandler() {
    if (exams.length === 0) {
      info("No exams to generate study plan for. Add exams first!");
      return;
    }

    const suggestions = computeStudySuggestionsFromExams(exams, events, {
      now: new Date(),
      preferredSlots: [
        { startHour: 18, endHour: 21, days: [1, 2, 3, 4, 5], label: "evening" },
        { startHour: 9, endHour: 12, days: [0, 6], label: "weekend-morning" },
        { startHour: 7, endHour: 9, days: [1, 2, 3, 4, 5], label: "morning" },
      ],
      intervals: [1, 3, 7, 14],
      sessionDurationHours: 1.5,
    });

    const formattedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      displayDate: new Date(suggestion.start).toLocaleDateString(),
      displayTime: `${new Date(suggestion.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${new Date(suggestion.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
    }));

    setSuggestedSessions(formattedSuggestions);
    setSelectedSessions(new Set());
    setShowSuggestions(true);
  }

  function toggleSessionSelection(sessionId: string) {
    const newSelected = new Set(selectedSessions);
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId);
    } else {
      newSelected.add(sessionId);
    }
    setSelectedSessions(newSelected);
  }

  async function addSelectedSessions() {
    const sessionsToAdd = suggestedSessions.filter(session =>
      selectedSessions.has(session.id.toString())
    );

    if (sessionsToAdd.length === 0) {
      info("Please select at least one session to add.");
      return;
    }

    const newEvents = sessionsToAdd.map(session => ({
      id: session.id,
      title: session.title,
      start: session.start,
      end: session.end,
      isStudySession: true
    }));

    setEvents(prev => [...prev, ...newEvents]);

    const user = auth.currentUser;
    const isGoogleUser = user && user.providerData?.some(p => p.providerId === 'google.com');

    if (isGoogleUser) {
      try {
        for (const session of sessionsToAdd) {
          await createGoogleCalendarEvent(session.title, session.start, session.end);
        }
        success(`Added ${sessionsToAdd.length} study sessions to both calendars!`);
      } catch (error) {
        success(`Added ${sessionsToAdd.length} study sessions (Google sync failed)`);
      }
    } else {
      success(`Added ${sessionsToAdd.length} study sessions!`);
    }

    setShowSuggestions(false);
  }

  async function onSelectEvent(event: EventItem) {
    // For all event types, open the edit modal
    setEditingEventId(event.id);
    setEditingEvent(event);
    setTitle(event.title);
    setStart(event.start.toISOString().slice(0, 16));
    setEnd(event.end.toISOString().slice(0, 16));
    setOpen(true);
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end gap-2">
        <Button onClick={() => {setOpen(true); setEditingEventId(null);}}>New Event</Button>
        <Button variant="outline" onClick={previewSuggestionsHandler}>
          Preview Study Suggestions
        </Button>
      </div>

      <DnDCalendar
        selectable
        onSelectSlot={(slotInfo: { start: Date; end: Date }) => {
          setTitle("");
          setStart(slotInfo.start.toISOString().slice(0, 16));
          setEnd(slotInfo.end.toISOString().slice(0, 16));
          setEditingEventId(null);
          setOpen(true);
        }}
        onSelectEvent={onSelectEvent}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const s = new Date(start), en = new Date(end);
              if (en <= s) return error("End must be after start");

              if (editingEventId !== null) {
                // Update existing event
                const eventToUpdate = events.find(ev => ev.id === editingEventId);
                if (eventToUpdate?.isStudySession) {
                  // Handle study session update with completion status
                  try {
                    const user = auth.currentUser;
                    if (!user) return error('User not connected');

                    const response = await fetch('/api/study-sessions', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        userId: user.uid,
                        id: eventToUpdate.id.toString(),
                        completed: (document.getElementById('completed') as HTMLInputElement)?.checked,
                        scheduled_start: s.toISOString(),
                        scheduled_end: en.toISOString(),
                        title,
                      })
                    });

                    if (response.ok) {
                      setEvents(prev => prev.map(ev =>
                        ev.id === editingEventId ? { ...ev, title, start: s, end: en, completed: (document.getElementById('completed') as HTMLInputElement)?.checked } : ev
                      ));
                      success('Study session updated!');
                    } else {
                      error('Update error');
                    }
                  } catch (err) {
                    error('Update error');
                  }
                } else if (eventToUpdate?.isGoogleEvent) {
                  try {
                    await updateGoogleCalendarEvent(editingEventId.toString(), title, s, en);
                    setEvents(prev => prev.map(ev =>
                      ev.id === editingEventId ? { ...ev, title, start: s, end: en } : ev
                    ));
                    success('Google Calendar event updated!');
                  } catch (err) {
                    error('Google Calendar event update error');
                    return;
                  }
                } else if (eventToUpdate?.isExam) {
                  // Handle exam update
                  try {
                    const user = auth.currentUser;
                    if (!user) return error('User not connected');

                    let googleCalendarId = eventToUpdate.googleId;
                    const isGoogleUser = user && user.providerData?.some(p => p.providerId === 'google.com');

                    if (isGoogleUser) {
                      if (eventToUpdate.googleId) {
                        // Update existing Google event
                        await updateGoogleCalendarEvent(eventToUpdate.googleId, title, s, en);
                      } else {
                        // Create new Google event
                        googleCalendarId = await createGoogleCalendarEvent(title, s, en);
                      }
                    }

                    const examId = editingEventId.toString().replace('exam-', '');
                    const response = await fetch('/api/exams', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: examId,
                        title: title.split(' (')[0], // Remove the subject part
                        due_date: s.toISOString().split('T')[0], // Format as date only
                        userId: user.uid,
                        googleCalendarId: googleCalendarId,
                      })
                    });

                    if (response.ok) {
                      // Update local event display
                      setEvents(prev => prev.map(ev =>
                        ev.id === editingEventId ? { ...ev, title, start: s, end: en, googleId: googleCalendarId, isGoogleEvent: !!googleCalendarId } : ev
                      ));
                      success('Exam updated!');
                    } else {
                      error('Exam update error');
                    }
                  } catch (err) {
                    error('Exam update error');
                  }
                } else {
                  setEvents(prev => prev.map(ev =>
                    ev.id === editingEventId ? { ...ev, title, start: s, end: en } : ev
                  ));
                  success('Event updated!');
                }
              } else {
                // Create new event
                setEvents(prev => [{ id: Date.now(), title, start: s, end: en }, ...prev]);
                success('Event created!');
              }
              setOpen(false);
              setEditingEventId(null);
              setEditingEvent(null);
              setTitle("");
              setStart("");
              setEnd("");
            }}
            className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-lg"
          >
            <h3 className="mb-4 text-lg font-semibold">
              {editingEventId !== null ? "Edit Event" : "Create Event"}
            </h3>
            <input
              className="mb-3 w-full rounded border px-3 py-2"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              className="mb-3 w-full rounded border px-3 py-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
            <input
              type="datetime-local"
              className="mb-3 w-full rounded border px-3 py-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
            {editingEvent?.isStudySession && (
              <div className="mb-3 flex items-center">
                <input
                  id="completed"
                  type="checkbox"
                  className="w-4 h-4 mr-2"
                  defaultChecked={editingEvent.completed}
                />
                <label htmlFor="completed" className="text-sm">Session completed</label>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  setEditingEventId(null);
                  setEditingEvent(null);
                  setTitle("");
                  setStart("");
                  setEnd("");
                }}
              >
                Cancel
              </Button>
              {editingEventId !== null && (
                <Button
                  variant="destructive"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (!confirm(`Delete "${editingEvent?.title}" ?`)) return;

                    const eventToDelete = events.find(ev => ev.id === editingEventId);
                    if (!eventToDelete) return;

                    if (eventToDelete.isStudySession) {
                      try {
                        const user = auth.currentUser;
                        if (!user) return error('User not connected');

                        const response = await fetch(`/api/study-sessions?id=${eventToDelete.id.toString()}&userId=${user.uid}`, {
                          method: 'DELETE'
                        });

                        if (response.ok) {
                          setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
                          success('Study session deleted!');
                        } else {
                          error('Deletion error');
                        }
                      } catch (err) {
                        error('Deletion error');
                      }
                    } else if (eventToDelete.isGoogleEvent) {
                      try {
                        await deleteGoogleCalendarEvent(eventToDelete.id.toString());
                        setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
                        success('Google Calendar event deleted!');
                      } catch (err) {
                        error('Google Calendar event deletion error');
                      }
                    } else if (eventToDelete.isExam) {
                      try {
                        const user = auth.currentUser;
                        if (!user) return error('User not connected');

                        // If the exam has a Google Calendar event, delete it too
                        if (eventToDelete.googleId) {
                          try {
                            await deleteGoogleCalendarEvent(eventToDelete.googleId);
                          } catch (err) {
                            console.error('Failed to delete Google Calendar event:', err);
                            // Don't fail the whole operation if Google sync fails
                          }
                        }

                        const examId = eventToDelete.id.toString().replace('exam-', '');
                        const response = await fetch(`/api/exams?id=${examId}&userId=${user.uid}`, {
                          method: 'DELETE'
                        });

                        if (response.ok) {
                          setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
                          success('Exam deleted!');
                        } else {
                          error('Exam deletion error');
                        }
                      } catch (err) {
                        error('Exam deletion error');
                      }
                    } else {
                      setEvents(prev => prev.filter(e => e.id !== eventToDelete.id));
                      success('Event deleted!');
                    }

                    setOpen(false);
                    setEditingEventId(null);
                    setEditingEvent(null);
                    setTitle("");
                    setStart("");
                    setEnd("");
                  }}
                >
                  Delete
                </Button>
              )}
              {editingEventId !== null && (
                <Button type="submit">
                  {editingEventId !== null ? "Update" : "Create"}
                </Button>
              )}
            </div>
          </form>
        </div>
      )}

      {showSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowSuggestions(false)} />
          <div className="relative z-10 w-full max-w-2xl max-h-[80vh] rounded-lg bg-card p-6 shadow-lg overflow-y-auto">
            <h3 className="mb-4 text-lg font-semibold">Study Session Suggestions</h3>
            <p className="text-sm text-muted-foreground mb-4">Select the sessions you want to add:</p>
            <div className="space-y-3 mb-6">
              {suggestedSessions.map((session) => (
                <div key={session.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    checked={selectedSessions.has(session.id.toString())}
                    onChange={() => toggleSessionSelection(session.id.toString())}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">{session.displayDate} • {session.displayTime}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {selectedSessions.size} of {suggestedSessions.length} selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSuggestions(false)}>Cancel</Button>
                <Button onClick={addSelectedSessions} disabled={selectedSessions.size === 0}>
                  Add {selectedSessions.size} Session{selectedSessions.size !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}
