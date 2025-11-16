export type Exam = {
  id: string;
  user_id: string;
  title: string;
  subject: string;
  description?: string;
  due_date: string;
  created_at: string;
  updated_at: string;
  priority: number; // 1-5
  difficulty: number; // 1-5
  estimated_hours: number;
  status: 'active' | 'completed' | 'cancelled';
  google_calendar_id?: string | null;
};

export type StudySession = {
  id: string;
  user_id: string;
  exam_id: string;
  title: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  completed: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
  google_calendar_id?: string | null;
};

export type UserPreferences = {
  id: string;
  user_id: string;
  preferred_slots: {
    startHour: number;
    endHour: number;
    days?: number[];
    label?: string;
  }[];
  intervals: number[];
  session_duration_hours: number;
  created_at: string;
  updated_at: string;
};
