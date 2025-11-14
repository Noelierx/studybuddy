import React from "react";
import { Brain, TrendingUp, Calendar, Zap } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => {
  return (
    <div className="bg-card text-card-foreground flex flex-col gap-3 rounded-xl border p-6">
      <div className="text-primary">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

interface LandingFeaturesProps {
  className?: string;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ className }) => {
  const features = [
    {
      icon: <Brain />,
      title: "Smart Scheduling",
      description:
        "AI-powered study plan generation based on exam priorities, difficulty, and your available time",
    },
    {
      icon: <TrendingUp />,
      title: "Track Progress",
      description:
        "Visual progress tracking for all your exams with detailed session history and completion rates",
    },
    {
      icon: <Calendar />,
      title: "Stay Organized",
      description:
        "Manage all exams and study sessions in one place with a clean, intuitive interface",
    },
    {
      icon: <Zap />,
      title: "Adaptive Planning",
      description:
        "Plans that automatically adjust to your unique study needs and changing schedule",
    },
  ];

  return (
    <section className={`${className || ""} py-12`}>
      <div className="container mx-auto max-w-5xl px-4">
        <h2 className="text-2xl font-semibold text-center">Everything You Need to Excel</h2>
        <p className="text-center text-muted-foreground mt-2">Powerful features designed to help you study smarter, not harder</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};