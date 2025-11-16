"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { BookOpen, Trash2 } from "lucide-react";
import BigCalendar from "../../components/big-calendar/BigCalendar";
// import { CalendarEventForm } from "../../components/calendar-event-form";
import { ExamForm } from "../../components/exam-form";

import { Exam } from "../../lib/database.types";

import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showExamForm, setShowExamForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const router = useRouter();


  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { onAuthStateChanged } = await import("firebase/auth");
      const { auth } = await import("../../lib/firebase");

      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            setCurrentUser(user);
            loadExams(user.uid);
          } else {
            router.push('/login');
          }
        });
      });
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    }
  };

  const loadExams = async (userId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/exams?userId=${userId}`);
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
        body: JSON.stringify({ ...examData, userId: currentUser?.uid }),
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



  const handleDeleteExam = async (examId: string | number) => {
    if (!confirm('Are you sure you want to delete this exam and all associated study sessions?')) {
      return;
    }

    try {
      const response = await fetch(`/api/exams?id=${examId}&userId=${currentUser?.uid}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setExams(prev => prev.filter(exam => String(exam.id) !== String(examId)));
        alert('Exam and associated study sessions deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete exam: ${error.error}`);
      }
    } catch (error) {
      alert('Error deleting exam');
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
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Exams */}
          <div className="space-y-6">
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
                      <div key={exam.id} className="p-3 border rounded-lg relative group">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:border-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calendar */}
          <div>
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


      </div>
    </div>
  );
}
