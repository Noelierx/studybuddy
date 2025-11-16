"use client";

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ExamFormData {
  title: string;
  subject: string;
  description: string;
  due_date: string;
  priority: number;
  difficulty: number;
  estimated_hours: number;
}

interface ExamFormProps {
  onSubmit: (exam: ExamFormData) => void;
  onCancel: () => void;
  initialData?: Partial<ExamFormData>;
}

export function ExamForm({ onSubmit, onCancel, initialData }: ExamFormProps) {
  const [formData, setFormData] = useState<ExamFormData>({
    title: initialData?.title || '',
    subject: initialData?.subject || '',
    description: initialData?.description || '',
    due_date: initialData?.due_date || '',
    priority: initialData?.priority || 3,
    difficulty: initialData?.difficulty || 3,
    estimated_hours: initialData?.estimated_hours || 4,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.due_date) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  const updateField = (field: keyof ExamFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Exam Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder="e.g., Midterm Exam"
          required
        />
      </div>

      <div>
        <Label htmlFor="subject">Subject *</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => updateField('subject', e.target.value)}
          placeholder="e.g., Computer Science"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div>
        <Label htmlFor="due_date">Due Date & Time *</Label>
        <Input
          id="due_date"
          type="datetime-local"
          value={formData.due_date}
          onChange={(e) => updateField('due_date', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="priority">
          Priority ({formData.priority}/5) - How important is this exam?
        </Label>
        <Input
          id="priority"
          type="range"
          min="1"
          max="5"
          value={formData.priority}
          onChange={(e) => updateField('priority', parseInt(e.target.value))}
        />
        <div className="text-xs text-muted-foreground mt-1">
          1 = Low priority, 5 = Highest priority
        </div>
      </div>

      <div>
        <Label htmlFor="difficulty">
          Difficulty ({formData.difficulty}/5) - How hard is this exam?
        </Label>
        <Input
          id="difficulty"
          type="range"
          min="1"
          max="5"
          value={formData.difficulty}
          onChange={(e) => updateField('difficulty', parseInt(e.target.value))}
        />
        <div className="text-xs text-muted-foreground mt-1">
          1 = Easy, 5 = Very difficult
        </div>
      </div>

      <div>
        <Label htmlFor="estimated_hours">Estimated Study Hours</Label>
        <Input
          id="estimated_hours"
          type="number"
          min="1"
          value={formData.estimated_hours}
          onChange={(e) => updateField('estimated_hours', parseInt(e.target.value))}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Add Exam
        </Button>
      </div>
    </form>
  );
}
