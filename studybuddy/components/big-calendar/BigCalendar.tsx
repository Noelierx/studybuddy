"use client";

import React, { useState } from "react";
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
import { computeStudySuggestions } from "./scheduler";

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();

type EventItem = { id: number; title: string; start: Date; end: Date };

const initialEvents: EventItem[] = [
  {
    id: 1,
    title: "Math - Past Paper",
    start: new Date(currentYear, currentMonth, 3, 10, 0),
    end: new Date(currentYear, currentMonth, 3, 11, 0),
  },
  {
    id: 2,
    title: "Physics Review",
    start: new Date(currentYear, currentMonth, 7, 14, 0),
    end: new Date(currentYear, currentMonth, 7, 15, 30),
  },
  {
    id: 3,
    title: "Group Study",
    start: new Date(currentYear, currentMonth, 14, 16, 0),
    end: new Date(currentYear, currentMonth, 14, 18, 0),
  },
  {
    id: 4,
    title: "Mock Exam",
    start: new Date(currentYear, currentMonth, 21, 9, 0),
    end: new Date(currentYear, currentMonth, 21, 12, 0),
  },
];

const DnDCalendar = withDragAndDrop(Calendar) as any;

export default function BigCalendar() {
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [previewSuggestions, setPreviewSuggestions] = useState<any[] | null>(null);
  const [selectedSuggestionIds, setSelectedSuggestionIds] = useState<Set<number>>(new Set());

  function openModal() {
    setTitle("");
    setStart("");
    setEnd("");
    setEditingEventId(null);
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
  }

  function addEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !start || !end) return;
    const s = new Date(start);
    const en = new Date(end);
    if (en <= s) {
      alert("End must be after start");
      return;
    }
    if (editingEventId) {
      setEvents((prev) => prev.map((ev) => (ev.id === editingEventId ? { ...ev, title, start: s, end: en } : ev)));
    } else {
      const newEvent: EventItem = { id: Date.now(), title, start: s, end: en };
      setEvents((prev) => [newEvent, ...prev]);
    }
    closeModal();
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
    setEditingEventId(null);
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
    const suggestions = computeStudySuggestions(events, {
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
    // default select all suggestions
    setSelectedSuggestionIds(new Set(suggestions.map((s: any) => s.id)));
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
                    onClick={() => {
                      // add selected suggestions to calendar
                      if (!previewSuggestions) return;
                      const toAdd = previewSuggestions.filter((s: any) => selectedSuggestionIds.has(s.id));
                      if (toAdd.length === 0) {
                        alert("No suggestions selected");
                        return;
                      }
                      const newEvents = toAdd.map((s: any) => ({ id: s.id, title: s.title, start: new Date(s.start), end: new Date(s.end) }));
                      setEvents((prev) => [...newEvents, ...prev]);
                      setPreviewSuggestions(null);
                      setSelectedSuggestionIds(new Set());
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
