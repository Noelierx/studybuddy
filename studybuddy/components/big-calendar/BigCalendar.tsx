"use client";

import React, { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "../shadcn-big-calendar/shadcn-big-calendar.css";
import { Button } from "../ui/button";
import { computeStudySuggestionsFromExams, Exam } from "./scheduler";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const now = new Date();

type EventItem = { id: string | number; title: string; start: Date; end: Date; isStudySession?: boolean; source?: string };

interface StudySession {
  id: number;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  exam_id: number;
  notes?: string;
}

interface PreviewSuggestion {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  reason?: string;
}

const initialEvents: EventItem[] = [];

const DnDCalendar = withDragAndDrop(Calendar) as any;

interface BigCalendarProps {
  exams: Exam[];
}

export default function BigCalendar({ exams }: BigCalendarProps) {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [previewSuggestions, setPreviewSuggestions] = useState<PreviewSuggestion[] | null>(null);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<string | number>>(new Set());
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [editingEventId, setEditingEventId] = useState<string | number | null>(null);

  function openModal() {
    setTitle("");
    setStart("");
    setEnd("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  async function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !start || !end) return;
    const s = new Date(start);
    const en = new Date(end);
    if (en <= s) {
      alert("End must be after start");
      return;
    }

    try {
      const res = await fetch('/api/calendar/from-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, start: s.toISOString(), end: en.toISOString() })
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert(`Failed to sync to Google Calendar: ${error.error}`);
        return;
      }

      const { event } = await res.json();

      const newEvent: EventItem = {
        id: event.id,
        title: event.summary,
        start: new Date(event.start.dateTime || event.start.date),
        end: new Date(event.end.dateTime || event.end.date),
        source: 'app'
      };

      setEvents((prev) => [newEvent, ...prev]);
      closeModal();
      window.location.reload();

    } catch (error) {
      alert('Error creating event');
      console.error(error);
    }
  }

  function toInputDateTime(d: Date) {
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset * 60000);
    return local.toISOString().slice(0, 16);
  }

  function onSelectSlot(slotInfo: any) {
    setTitle("");
    setStart(toInputDateTime(new Date(slotInfo.start)));
    setEnd(toInputDateTime(new Date(slotInfo.end)));
    setOpen(true);
  }

  function onEventDrop({ event, start: newStart, end: newEnd }: any) {
    setEvents((prev) => prev.map((ev) => (ev.id === event.id ? { ...ev, start: newStart, end: newEnd } : ev)));
  }

  function onEventResize({ event, start: newStart, end: newEnd }: any) {
    setEvents((prev) => prev.map((ev) => (ev.id === event.id ? { ...ev, start: newStart, end: newEnd } : ev)));
  }

  function onSelectEvent(event: EventItem) {
    setEditingEventId(event.id);
    setTitle(event.title);
    setStart(toInputDateTime(new Date(event.start)));
    setEnd(toInputDateTime(new Date(event.end)));
    setOpen(true);
  }

  async function previewSuggestionsHandler() {
    if (exams.length === 0) {
      alert("No exams to generate study plan for. Add some exams first!");
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
    setPreviewSuggestions(suggestions);
    setSelectedSuggestionIds(new Set(suggestions.map((s: any) => s.id)));
  }

  useEffect(() => {
    async function load() {
      setLoadingEvents(true)
      setFetchError(null)
      try {
        const studyRes = await fetch('/api/study-sessions')
        const studyData = await studyRes.json()
        const sessions = studyData.sessions || []
        setStudySessions(sessions)

        const googleRes = await fetch('/api/calendar/from-supabase')
        if (!googleRes.ok) {
          const err = await googleRes.json().catch(() => ({ error: 'Unknown error' }))
          setFetchError(err?.error || `HTTP ${googleRes.status}`)
          setLoadingEvents(false)
          return
        }

        const googleData = await googleRes.json()
        const googleEvents: any[] = googleData.events ?? []
        const googleEventTitles = new Set(googleEvents.map((ev: any) => ev.summary))

        const sessionsToSync = sessions.filter((session: any) => !googleEventTitles.has(session.title))

        for (const session of sessionsToSync) {
          try {
            const calendarRes = await fetch('/api/calendar/from-supabase', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                title: session.title,
                start: session.scheduled_start,
                end: session.scheduled_end,
                isStudySession: true,
                examId: session.exam_id
              })
            });

            if (!calendarRes.ok) {
              const errorData = await calendarRes.json().catch(() => ({}))
            }
          } catch (error) {
          }
        }

        const mapped: EventItem[] = googleEvents.map((ev: any, idx: number) => {
          const s = ev.start?.dateTime ?? ev.start?.date
          const e = ev.end?.dateTime ?? ev.end?.date
          const startDate = s ? new Date(s) : new Date()
          const endDate = e ? new Date(e) : new Date(startDate.getTime() + 60 * 60 * 1000)

          const isStudySession = sessions.some((sess: any) =>
            sess.title === ev.summary &&
            Math.abs(new Date(sess.scheduled_start).getTime() - startDate.getTime()) < 60000
          );

          return {
            id: ev.id ?? Date.now() + idx,
            title: ev.summary ?? '(no title)',
            start: startDate,
            end: endDate,
            source: 'google',
            isStudySession
          }
        })

        setEvents((prev) => {
          const existingIds = new Set(prev.map((p) => String(p.id)))
          const toAdd = mapped.filter((m) => !existingIds.has(String(m.id)))
          return [...toAdd, ...prev]
        })
      } catch (err: any) {
        setFetchError(String(err?.message ?? err))
      } finally {
        setLoadingEvents(false)
      }
    }

    load()
  }, [])

  if (loadingEvents) {
    return (
      <div className="w-full flex items-center justify-center min-h-[700px]">
        <div className="text-lg">Loading calendar...</div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="w-full flex items-center justify-center min-h-[700px]">
        <div className="text-red-500">Error loading calendar: {fetchError}</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end gap-2">
        <Button onClick={openModal}>New Event</Button>
        <Button variant="outline" onClick={previewSuggestionsHandler}>Preview Suggestions</Button>
      </div>

      <DnDCalendar
        selectable
        resizable
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 700 }}
      />

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <form
            onSubmit={addEvent}
            className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-lg"
          >
            <h3 className="mb-4 text-lg font-semibold">Create Event</h3>

            <label className="mb-2 block text-sm">Title</label>
            <input
              className="mb-3 w-full rounded border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <label className="mb-2 block text-sm">Start</label>
            <input
              type="datetime-local"
              className="mb-3 w-full rounded border px-3 py-2"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />

            <label className="mb-2 block text-sm">End</label>
            <input
              type="datetime-local"
              className="mb-3 w-full rounded border px-3 py-2"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={closeModal} type="button">
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </div>
      )}

      {previewSuggestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setPreviewSuggestions(null)} />
          <div className="relative z-10 w-full max-w-2xl rounded-lg bg-card p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold">Suggested Study Sessions</h3>
            <ul className="max-h-96 overflow-auto space-y-2">
                {previewSuggestions.map((s: any) => (
                  <li key={s.id} className="rounded border p-3 flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedSuggestionIds.has(s.id)}
                      onChange={() => {
                        setSelectedSuggestionIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(s.id)) next.delete(s.id);
                          else next.add(s.id);
                          return next;
                        });
                      }}
                    />
                    <div className="flex-1">
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-sm text-muted-foreground">{new Date(s.start).toLocaleString()} — {new Date(s.end).toLocaleString()}</div>
                      <div className="text-xs text-muted-foreground">{s.reason}</div>
                    </div>
                  </li>
                ))}
            </ul>
              <div className="mt-4 flex justify-between">
                <div>
                  <Button
                    variant="secondary"
                    onClick={async () => {
                      if (!previewSuggestions) return;
                      const toAdd = previewSuggestions.filter((s: any) => selectedSuggestionIds.has(s.id));
                      if (toAdd.length === 0) {
                        alert("No suggestions selected");
                        return;
                      }

                      try {
                        const first = toAdd[0];
                        let exam: any = null;

                        if (typeof first?.id === 'string') {
                          const m = String(first.id).match(/^session-([^-/]+)(?:-|$)/);
                          if (m) {
                            const aid = m[1];
                            exam = exams.find((e: any) => String(e.id) === aid);
                          }
                        }

                        if (!exam && typeof first?.reason === 'string') {
                          const m2 = first.reason.match(/Before\s+(.+?)(?:\s*\(|$)/);
                          if (m2) {
                            const examTitle = m2[1].trim();
                            exam = exams.find((e: any) => e.title === examTitle);
                          }
                        }

                        if (!exam) {
                          alert("Could not find exam for this session");
                          return;
                        }

                        const savePromises = toAdd.map(s =>
                          fetch('/api/study-sessions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              exam_id: exam.id,
                              title: s.title,
                              scheduled_start: new Date(s.start).toISOString(),
                              scheduled_end: new Date(s.end).toISOString(),
                              notes: s.reason
                            })
                          })
                        );

                        const saveResults = await Promise.all(savePromises);
                        const failed = saveResults.filter(r => !r.ok);

                        if (failed.length > 0) {
                          alert(`${failed.length} sessions failed to save to database`);
                          return;
                        }

                        const calendarPromises = toAdd.map(s =>
                          fetch('/api/calendar/from-supabase', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              title: s.title,
                              start: new Date(s.start).toISOString(),
                              end: new Date(s.end).toISOString(),
                              isStudySession: true,
                              examId: exam.id
                            })
                          })
                        );

                        const calendarResults = await Promise.all(calendarPromises);
                        const calendarFailed = calendarResults.filter(r => !r.ok);

                        if (calendarFailed.length > 0) {
                          alert(`${calendarFailed.length} sessions failed to sync to Google Calendar`);
                        }

                        const newEvents = toAdd.map((s: any) => ({
                          id: s.id,
                          title: s.title,
                          start: new Date(s.start),
                          end: new Date(s.end),
                          isStudySession: true,
                          source: 'study-session'
                        }));
                        setEvents((prev) => [...newEvents, ...prev]);

                        setPreviewSuggestions(null);
                        setSelectedSuggestionIds(new Set());
                      } catch (error) {
                        alert('Error saving study sessions');
                        console.error(error);
                      }
                    }}
                  >
                    Add Selected
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setPreviewSuggestions(null)}>Close</Button>
                </div>
              </div>
          </div>
        </div>
      )}
    </div>
  );
}
