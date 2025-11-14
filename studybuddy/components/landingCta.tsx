import { Button } from "./ui/button";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface LandingCTAProps {
  className?: string;
}

export const LandingCTA: React.FC<LandingCTAProps> = ({ className }) => {
  return (
    <section className={`${className || ""} py-12 bg-gradient-to-r from-sky-50 to-white`}>
      <div className="container mx-auto max-w-3xl text-center px-4">
        <h2 className="text-3xl sm:text-4xl font-semibold">Ready to Ace Your Exams?</h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Join thousands of students who are already studying smarter with Study
          Buddy
        </p>

        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Get Started Free</Link>
          </Button>
        </div>

        <div className="mt-4 flex items-center justify-center text-sm text-muted-foreground">
          <CheckCircle className="mr-2 h-4 w-4 text-primary" />
          <span>Free to use. No credit card required.</span>
        </div>
      </div>
    </section>
  )
};