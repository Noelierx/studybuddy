"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Check, Circle, Clock } from 'lucide-react';
import { Exam } from '../lib/database.types';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface StudySession {
  id: string;
  exam_id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  completed: boolean;
}

interface ProgressTrackerProps {
  exams: Exam[];
}

export function ProgressTracker({ exams }: ProgressTrackerProps) {
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudySessions();
  }, []);

  const loadStudySessions = async () => {
    try {
      setLoading(true);

      // Get current user from Firebase
      const user = await new Promise<any>((resolve) => {
        onAuthStateChanged(auth, (user) => resolve(user))
      })

      if (!user) {
        console.error('Not authenticated');
        return;
      }

      const response = await fetch(`/api/study-sessions?userId=${user.uid}`);
      if (response.ok) {
        const data = await response.json();
        setStudySessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load study sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (sessionId: string, completed: boolean) => {
    try {
      // Get current user from Firebase
      const user = await new Promise<any>((resolve, reject) => {
        onAuthStateChanged(auth, (user) => {
          if (user) resolve(user);
          else reject(new Error('Not authenticated'));
        })
      })

      if (!user) {
        alert('Not authenticated');
        return;
      }

      const now = new Date().toISOString();
      const response = await fetch('/api/study-sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          id: sessionId,
          completed: !completed,
          actual_start: !completed ? now : undefined,
          actual_end: !completed ? now : undefined,
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStudySessions(prev =>
          prev.map(s => s.id === sessionId ? data.session : s)
        );
      } else {
        alert('Failed to update session');
      }
    } catch (error) {
      alert('Error updating session');
    }
  };

  const getExamProgress = (examId: string) => {
    const examSessions = studySessions.filter(s => s.exam_id === examId);
    const completed = examSessions.filter(s => s.completed).length;
    const total = examSessions.length;
    const exam = exams.find(e => e.id === examId);
    const expectedSessions = exam ? Math.max(1, Math.ceil(exam.estimated_hours / 1.5)) : 1;
    return { completed, total, expected: expectedSessions };
  };

  if (loading) {
    return <div className="text-center py-4">Loading progress...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Study Progress</h3>

      {exams.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No exams to track progress for</p>
        </div>
      ) : (
        exams.map(exam => {
          const progress = getExamProgress(exam.id);
          const completionRate = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

          return (
            <Card key={exam.id}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{exam.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{exam.subject}</span>
                  <span>•</span>
                  <span>{progress.completed}/{progress.total} sessions completed</span>
                  <span>•</span>
                  <span>{Math.round(completionRate)}% done</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionRate}%` }}
                  ></div>
                </div>

                {studySessions
                  .filter(s => s.exam_id === exam.id)
                  .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())
                  .slice(0, 5) // Show only recent/next sessions
                  .map(session => (
                    <div key={session.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleComplete(session.id, session.completed)}
                        className="p-0 h-6 w-6"
                      >
                        {session.completed ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Circle className="h-4 w-4 text-gray-400" />
                        )}
                      </Button>
                      <div className="flex-1">
                        <div className={`text-sm ${session.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {session.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.scheduled_start).toLocaleDateString()} at{' '}
                          {new Date(session.scheduled_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  ))}

                {studySessions.filter(s => s.exam_id === exam.id).length > 5 && (
                  <div className="text-xs text-muted-foreground text-center mt-2">
                    +{studySessions.filter(s => s.exam_id === exam.id).length - 5} more sessions
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
