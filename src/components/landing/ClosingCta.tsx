import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function ClosingCta() {
  const { user } = useAuth();

  return (
    <section className="px-4 pb-20 md:px-8 md:pb-28">
      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-8 rounded-[var(--radius)] bg-primary px-8 py-12 text-primary-foreground md:flex-row md:items-center md:px-14 md:py-16">
        <h2 className="max-w-[14ch] font-serif text-3xl font-medium leading-[1.15] md:text-5xl">
          Start with one recording.
        </h2>
        <Button
          asChild
          size="lg"
          className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 active:scale-[0.98]"
        >
          <Link to={user ? "/app" : "/signup"}>{user ? "Open app" : "Get started"}</Link>
        </Button>
      </div>
    </section>
  );
}
