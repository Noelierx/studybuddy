import { PlusCircle, Sparkles, TrendingUp } from "lucide-react";

interface StepProps {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ number, icon, title, description }) => {
  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6 flex flex-col items-start gap-3">
      <div className="flex items-center gap-3">
        <div className="rounded-full bg-primary/10 text-primary w-8 h-8 flex items-center justify-center font-semibold">{number}</div>
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
};

interface LandingHowItWorksProps {
  className?: string;
}

export const LandingHowItWorks: React.FC<LandingHowItWorksProps> = ({ className }) => {
  const steps = [
    {
      icon: <PlusCircle />,
      title: "Add your exams",
      description:
        "Input your exam dates, subjects, priorities, and difficulty levels to get started",
    },
    {
      icon: <Sparkles />,
      title: "Generate your plan",
      description:
        "We create an optimized study schedule that fits your needs and maximizes your success",
    },
    {
      icon: <TrendingUp />,
      title: "Study & Succeed",
      description:
        "Follow your personalized plan, track your progress, and ace your exams with confidence",
    },
  ];

  return (
    <section className={`${className || ""} py-12`}>
      <div className="container mx-auto max-w-4xl px-4">
        <h2 className="text-2xl font-semibold text-center">How it works</h2>
        <p className="text-center text-muted-foreground mt-2">Get started in three simple steps</p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {steps.map((step, index) => (
            <Step key={index} number={index + 1} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
};