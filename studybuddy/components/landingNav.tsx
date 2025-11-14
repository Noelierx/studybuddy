import Link from "next/link";
import { Button } from "./ui/button";
import { GraduationCap } from "lucide-react";

interface LandingNavProps {
  className?: string;
}

export const LandingNav: React.FC<LandingNavProps> = ({ className }) => {
  return (
    <nav className={`${className || ""} py-4`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span>Study Buddy</span>
        </Link>

        <div>
          <Button asChild variant="outline">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};