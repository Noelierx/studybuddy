import Link from "next/link";
import { Button } from "./ui/button";
import { Brain, Sparkles } from "lucide-react";

interface LandingHeroProps {
  className?: string;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ className }) => {
  return (
    <section className={`${className || ""} py-16`}>
      <div className="container mx-auto px-4 max-w-6xl flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1">
          <h1 className="text-4xl sm:text-5xl font-extrabold">Master your studies with intelligent planning</h1>
          <p className="mt-4 text-lg text-muted-foreground">Study Buddy generates optimized revision schedules tailored to your exams, priorities, and availability</p>

          <div className="mt-8 flex items-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Login</Link>
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-64 h-64 rounded-xl bg-gradient-to-tr from-white to-sky-50 border shadow-sm flex items-center justify-center">
            <Brain className="h-20 w-20 text-primary" />
            <Sparkles className="absolute -top-4 -right-6 h-8 w-8 text-yellow-400" />
          </div>
        </div>
      </div>
    </section>
  );
};