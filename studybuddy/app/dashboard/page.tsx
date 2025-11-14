import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Plus } from "lucide-react";
import BigCalendar from "../../components/big-calendar/BigCalendar";

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sampleEvents(): Record<number, { title: string; color: string }[]> {
  // Simple static events for demo — replace with dynamic data later
  return {
    3: [{ title: "Math - Past Paper", color: "bg-amber-200 text-amber-800" }],
    7: [{ title: "Physics Review", color: "bg-sky-200 text-sky-800" }],
    14: [{ title: "Group Study", color: "bg-emerald-200 text-emerald-800" }],
    21: [{ title: "Mock Exam", color: "bg-rose-200 text-rose-800" }],
  };
}

export default function DashboardPage() {
  const events = sampleEvents();

  // Generate a simple month grid (days 1..31) for demo purposes
  const days = Array.from({ length: 35 }).map((_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <Button asChild>
              <button className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Event
              </button>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <BigCalendar />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
