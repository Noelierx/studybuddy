"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface EventFormData {
  title: string;
  start: string;
  end: string;
}

interface CalendarEventFormProps {
  onSubmit: (event: EventFormData) => void;
  onCancel: () => void;
  initialData?: Partial<EventFormData>;
}

export function CalendarEventForm({ onSubmit, onCancel, initialData }: CalendarEventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    start: initialData?.start || '',
    end: initialData?.end || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.start || !formData.end) {
      alert('Please fill in all fields');
      return;
    }

    const startDate = new Date(formData.start);
    const endDate = new Date(formData.end);

    if (endDate <= startDate) {
      alert('End time must be after start time');
      return;
    }

    onSubmit(formData);
  };

  const updateField = (field: keyof EventFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="e.g., Team Meeting"
          required
        />
      </div>

      <div>
        <Label htmlFor="start">Start Time *</Label>
        <Input
          id="start"
          type="datetime-local"
          value={formData.start}
          onChange={(e) => updateField('start', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="end">End Time *</Label>
        <Input
          id="end"
          type="datetime-local"
          value={formData.end}
          onChange={(e) => updateField('end', e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Event
        </Button>
      </div>
    </form>
  );
}
