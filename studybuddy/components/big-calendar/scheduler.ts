import { differenceInDays, addDays, startOfDay, setHours, isBefore, isAfter } from 'date-fns';

export type CalendarEvent = { id: string | number; title: string; start: Date; end: Date };
export type SuggestedSession = { id: string | number; title: string; start: Date; end: Date; reason?: string };

export type Exam = {
  id: string;
  title: string;
  subject: string;
  due_date: string;
  priority: number;
  difficulty: number;
  estimated_hours: number;
};

export type SchedulerOptions = {
  now?: Date;
  preferredSlots?: { startHour: number; endHour: number; days?: number[]; label?: string }[];
  intervals?: number[]; // days before deadline
  sessionDurationHours?: number; // default 1.5
  estimatedDurations?: Record<string, number>; // hours per subject
  priorityMap?: Record<string, number>; // subject -> priority (1 low - 5 high)
};

function isDeadlineEvent(ev: CalendarEvent) {
  const t = ev.title.toLowerCase();
  return /exam|final|deadline|mock|due/.test(t);
}

function extractSubject(ev: CalendarEvent) {
  const m = ev.title.split(/[-:(]/)[0].trim();
  return m.split(" ").slice(0, 3).join(" ");
}

function slotIsFree(start: Date, end: Date, busy: CalendarEvent[]) {
  for (const b of busy) {
    if (start < b.end && end > b.start) return false;
  }
  return true;
}

export function computeStudySuggestions(events: CalendarEvent[], opts?: SchedulerOptions): SuggestedSession[] {
  const now = opts?.now ?? new Date();
  const preferredSlots =
    opts?.preferredSlots ?? [
      { startHour: 18, endHour: 21, days: [1, 2, 3, 4, 5], label: "evening" },
      { startHour: 9, endHour: 12, days: [0, 6], label: "weekend-morning" },
      { startHour: 7, endHour: 9, days: [1, 2, 3, 4, 5], label: "morning" },
    ];
  const intervals = opts?.intervals ?? [1, 3, 7, 14];
  const sessionDurationHours = opts?.sessionDurationHours ?? 1.5;
  const estimatedDurations = opts?.estimatedDurations ?? {};
  const priorityMap = opts?.priorityMap ?? {};

  const busy: CalendarEvent[] = events.map((e) => ({ id: e.id, title: e.title, start: new Date(e.start), end: new Date(e.end) }));

  const deadlines = events
    .filter(isDeadlineEvent)
    .filter((d) => new Date(d.start) > now)
    .sort((a, b) => {
      const pa = priorityMap[extractSubject(a)] ?? priorityMap[extractSubject(a).toLowerCase()] ?? 3;
      const pb = priorityMap[extractSubject(b)] ?? priorityMap[extractSubject(b).toLowerCase()] ?? 3;
      if (pa !== pb) return pb - pa; // higher priority first
      return +new Date(a.start) - +new Date(b.start);
    });

  const suggestions: SuggestedSession[] = [];
  const occupied: CalendarEvent[] = [...busy]; // includes existing events and placed suggestions

  for (const dl of deadlines) {
    const subject = extractSubject(dl);
    const estHours = estimatedDurations[subject] ?? estimatedDurations[subject.toLowerCase()] ?? 2; // default 2 hours
    const priority = priorityMap[subject] ?? priorityMap[subject.toLowerCase()] ?? 3;

    const baseSessions = Math.max(1, Math.ceil(estHours / sessionDurationHours));
    const extra = Math.max(0, Math.floor((priority - 3) / 2));
    const totalSessions = Math.min(8, baseSessions + extra); // cap a bit higher

    const chosenIntervals: number[] = [];
    let idx = 0;
    while (chosenIntervals.length < totalSessions) {
      chosenIntervals.push(intervals[idx % intervals.length] + Math.floor(idx / intervals.length) * Math.max(1, intervals[intervals.length - 1]));
      idx++;
      if (idx > 20) break; // safety
    }

    for (let i = 0; i < chosenIntervals.length; i++) {
      const daysBefore = chosenIntervals[i];
      const candidateDayBase = addDays(startOfDay(new Date(dl.start)), -daysBefore);
      if (isBefore(candidateDayBase, now)) continue; // skip past

      let placed = false;

      for (let slotIdx = 0; slotIdx < preferredSlots.length && !placed; slotIdx++) {
        const slot = preferredSlots[slotIdx];
        const weekday = candidateDayBase.getDay();
        if (slot.days && !slot.days.includes(weekday)) continue;

        for (let hour = slot.startHour; hour + sessionDurationHours <= slot.endHour; hour++) {
          const s = setHours(startOfDay(candidateDayBase), hour);
          const e = new Date(s);
          e.setHours(s.getHours() + Math.floor(sessionDurationHours));
          e.setMinutes(s.getMinutes() + (sessionDurationHours % 1) * 60);

          if (isBefore(e, now)) continue;
          if (slotIsFree(s, e, occupied)) {
            const sug: SuggestedSession = { id: Date.now() + Math.floor(Math.random() * 100000), title: `Study: ${subject}`, start: s, end: e, reason: `Before ${dl.title}` };
            suggestions.push(sug);
            occupied.push({ id: sug.id, title: sug.title, start: sug.start, end: sug.end });
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        for (let back = 1; back <= 3 && !placed; back++) {
          const d2 = addDays(candidateDayBase, -back);
          for (let slotIdx = 0; slotIdx < preferredSlots.length && !placed; slotIdx++) {
            const slot = preferredSlots[slotIdx];
            const weekday = d2.getDay();
            if (slot.days && !slot.days.includes(weekday)) continue;
            for (let hour = slot.startHour; hour + sessionDurationHours <= slot.endHour; hour++) {
              const s = setHours(startOfDay(d2), hour);
              const e = new Date(s);
              e.setHours(s.getHours() + Math.floor(sessionDurationHours));
              e.setMinutes(s.getMinutes() + (sessionDurationHours % 1) * 60);
              if (isBefore(e, now)) continue;
              if (slotIsFree(s, e, occupied)) {
                const sug: SuggestedSession = { id: Date.now() + Math.floor(Math.random() * 100000), title: `Study: ${subject}`, start: s, end: e, reason: `Before ${dl.title}` };
                suggestions.push(sug);
                occupied.push({ id: sug.id, title: sug.title, start: sug.start, end: sug.end });
                placed = true;
                break;
              }
            }
          }
        }
      }

    }
  }

  return suggestions;
}

export function computeStudySuggestionsFromExams(exams: Exam[], busyEvents: CalendarEvent[], opts?: SchedulerOptions): SuggestedSession[] {
  const now = opts?.now ?? new Date();
  const preferredSlots =
    opts?.preferredSlots ?? [
      { startHour: 18, endHour: 21, days: [1, 2, 3, 4, 5], label: "evening" },
      { startHour: 9, endHour: 12, days: [0, 6], label: "weekend-morning" },
      { startHour: 7, endHour: 9, days: [1, 2, 3, 4, 5], label: "morning" },
    ];
  const intervals = opts?.intervals ?? [1, 3, 7, 14];
  const sessionDurationHours = opts?.sessionDurationHours ?? 1.5;

  const busy: CalendarEvent[] = busyEvents.map((e) => ({ id: e.id, title: e.title, start: new Date(e.start), end: new Date(e.end) }));

  const sortedExams = exams
    .filter((exam) => new Date(exam.due_date) > now)
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority; // higher priority first
      return +new Date(a.due_date) - +new Date(b.due_date);
    });

  const suggestions: SuggestedSession[] = [];
  const occupied: CalendarEvent[] = [...busy]; // includes existing events and placed suggestions

  for (const exam of sortedExams) {
    const subject = exam.subject;
    const estHours = exam.estimated_hours;
    const priority = exam.priority;
    const difficulty = exam.difficulty;

    const difficultyMultiplier = 1 + (difficulty - 3) * 0.2; // easy: 0.6, medium: 1, hard: 1.4
    let baseSessions = Math.max(1, Math.ceil((estHours * difficultyMultiplier) / sessionDurationHours));

    const extraSessions = Math.max(0, Math.floor((priority - 3) / 2));
    const totalSessions = Math.min(12, baseSessions + extraSessions); // cap

    const chosenIntervals: number[] = [];
    let idx = 0;
    while (chosenIntervals.length < totalSessions) {
      chosenIntervals.push(intervals[idx % intervals.length] + Math.floor(idx / intervals.length) * Math.max(1, intervals[intervals.length - 1]));
      idx++;
      if (idx > 30) break; // safety
    }

    for (let i = 0; i < chosenIntervals.length; i++) {
      const daysBefore = chosenIntervals[i];
      const candidateDayBase = addDays(startOfDay(new Date(exam.due_date)), -daysBefore);
      if (isBefore(candidateDayBase, now)) continue;

      let placed = false;

      for (let slotIdx = 0; slotIdx < preferredSlots.length && !placed; slotIdx++) {
        const slot = preferredSlots[slotIdx];
        const weekday = candidateDayBase.getDay();
        if (slot.days && !slot.days.includes(weekday)) continue;

        for (let hour = slot.startHour; hour + sessionDurationHours <= slot.endHour; hour++) {
          const s = setHours(startOfDay(candidateDayBase), hour);
          const e = new Date(s);
          e.setHours(s.getHours() + Math.floor(sessionDurationHours));
          e.setMinutes(s.getMinutes() + (sessionDurationHours % 1) * 60);

          if (isBefore(e, now)) continue;
          if (slotIsFree(s, e, occupied)) {
            const sug: SuggestedSession = {
              id: `session-${exam.id}-${i}`,
              title: `Study: ${subject} (${exam.title})`,
              start: s,
              end: e,
              reason: `Before ${exam.title} (${daysBefore} days)`
            };
            suggestions.push(sug);
            occupied.push({ id: sug.id, title: sug.title, start: sug.start, end: sug.end });
            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        for (let back = 1; back <= 3 && !placed; back++) {
          const d2 = addDays(candidateDayBase, -back);
          for (let slotIdx = 0; slotIdx < preferredSlots.length && !placed; slotIdx++) {
            const slot = preferredSlots[slotIdx];
            const weekday = d2.getDay();
            if (slot.days && !slot.days.includes(weekday)) continue;
            for (let hour = slot.startHour; hour + sessionDurationHours <= slot.endHour; hour++) {
              const s = setHours(startOfDay(d2), hour);
              const e = new Date(s);
              e.setHours(s.getHours() + Math.floor(sessionDurationHours));
              e.setMinutes(s.getMinutes() + (sessionDurationHours % 1) * 60);
              if (isBefore(e, now)) continue;
              if (slotIsFree(s, e, occupied)) {
                const sug: SuggestedSession = {
                  id: `session-${exam.id}-${i}-${back}`,
                  title: `Study: ${subject} (${exam.title})`,
                  start: s,
                  end: e,
                  reason: `Before ${exam.title} (${daysBefore + back} days)`
                };
                suggestions.push(sug);
                occupied.push({ id: sug.id, title: sug.title, start: sug.start, end: sug.end });
                placed = true;
                break;
              }
            }
          }
        }
      }
    }
  }

  return suggestions;
}
