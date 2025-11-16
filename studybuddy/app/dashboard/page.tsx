"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus, BookOpen, Calendar as CalendarIcon } from "lucide-react";
import BigCalendar from "../../components/big-calendar/BigCalendar";
import { ExamForm } from "../../components/exam-form";
import { CalendarEventForm } from "../../components/calendar-event-form";
import { ProgressTracker } from "../../components/progress-tracker";
import { Exam } from "../../lib/database.types";

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showExamForm, setShowExamForm] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/exams');
      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (examData: any) => {
    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(examData),
      });

      if (response.ok) {
        const data = await response.json();
        setExams(prev => [...prev, data.exam]);
        setShowExamForm(false);
      } else {
        alert('Failed to create exam');
      }
    } catch (error) {
      alert('Error creating exam');
    }
  };

  const handleCreateEvent = async (eventData: any) => {
    try {
      const response = await fetch('/api/calendar/from-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        setShowEventForm(false);
        alert('Event created successfully in Google Calendar!');
      } else {
        const error = await response.json();
        alert(`Failed to create event: ${error.error}`);
      }
    } catch (error) {
      alert('Error creating event');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button onClick={() => setShowExamForm(true)}>
              <BookOpen className="h-4 w-4 mr-2" />
              Add Exam
            </Button>
            <Button variant="outline" onClick={() => setShowEventForm(true)}>
              <CalendarIcon className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Progress & Exams */}
          <div className="xl:col-span-2 space-y-6">
            {/* Quick Exam Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Your Exams</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div>Loading exams...</div>
                ) : exams.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No exams yet. Add your first exam to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exams.map((exam) => (
                      <div key={exam.id} className="p-3 border rounded-lg">
                        <h3 className="font-semibold">{exam.title}</h3>
                        <p className="text-sm text-muted-foreground">{exam.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(exam.due_date).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span>Priority: {exam.priority}/5</span>
                          <span>Difficulty: {exam.difficulty}/5</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Progress Tracking */}
            <ProgressTracker exams={exams} />
          </div>

          {/* Calendar */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Calendar & Study Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <BigCalendar exams={exams} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Exam Form Modal */}
        {showExamForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowExamForm(false)} />
            <div className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">Add New Exam</h3>
              <ExamForm
                onSubmit={handleCreateExam}
                onCancel={() => setShowExamForm(false)}
              />
            </div>
          </div>
        )}

        {/* Event Form Modal */}
        {showEventForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowEventForm(false)} />
            <div className="relative z-10 w-full max-w-md rounded-lg bg-card p-6 shadow-lg">
              <h3 className="mb-4 text-lg font-semibold">Create Calendar Event</h3>
              <CalendarEventForm
                onSubmit={handleCreateEvent}
                onCancel={() => setShowEventForm(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
