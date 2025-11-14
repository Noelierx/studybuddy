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
  
  // simple categories + suggested flag

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

  // style events: suggested study sessions get a distinct look
  function eventStyleGetter(event: any) {
    if (event.suggested) {
      return {
        style: {
          backgroundColor: event.color || "rgba(16,185,129,0.18)",
          border: "1px dashed rgba(16,185,129,0.6)",
          color: "#065f46",
        },
      };
    }
    return {};
  }

  // Generate study sessions before detected deadlines
  function suggestFocusTime() {
    const now = new Date();
    const upcomingDeadlines = events.filter((ev) => {
      const titleLower = ev.title.toLowerCase();
      const isDeadlineKeyword = /exam|final|deadline|mock|due/.test(titleLower);
      // only future deadlines
      return isDeadlineKeyword && new Date(ev.start) > now;
    });

    const suggestions: EventItem[] = [];
    upcomingDeadlines.forEach((dl) => {
      const dlDate = new Date(dl.start);
      const subject = dl.title.split(/[:\-\(]/)[0].trim().split(" ").slice(0,2).join(" ");
      // create up to 3 sessions: D-1, D-3, D-6 at 18:00-19:30
      const offsets = [1, 3, 6];
      offsets.forEach((off, idx) => {
        const d = new Date(dlDate);
        d.setDate(dlDate.getDate() - off);
        if (d <= now) return; // don't schedule in the past
        const s = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 0);
        const e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 19, 30);
        const id = Date.now() + Math.floor(Math.random() * 10000) + idx;
        suggestions.push({ id, title: `Study: ${subject}`, start: s, end: e, suggested: true, color: "rgba(99,102,241,0.18)" } as any);
      });
    });

    if (suggestions.length === 0) {
      alert("No upcoming deadlines found to suggest focus time.");
      return;
    }

    // prepend suggestions so they are visible
    setEvents((prev) => [...suggestions, ...prev]);
    alert(`Added ${suggestions.length} suggested study sessions.`);
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex justify-end gap-2">
        <Button onClick={openModal}>New Event</Button>
        <Button variant="outline" onClick={suggestFocusTime}>Suggest Focus Time</Button>
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
        eventPropGetter={eventStyleGetter}
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
    </div>
  );
}
