import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function LandingFooter() {
  const { user } = useAuth();

  return (
    <footer className="border-t border-border px-4 py-10 md:px-8">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/owl-favicon.svg" alt="" className="h-7 w-7" />
          <span className="text-sm font-semibold">Devowl Transcriptor</span>
        </Link>
        <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
          {user ? (
            <Link to="/app" className="hover:text-foreground">
              Open app
            </Link>
          ) : (
            <>
              <Link to="/login" className="hover:text-foreground">
                Log in
              </Link>
              <Link to="/signup" className="hover:text-foreground">
                Get started
              </Link>
            </>
          )}
          <a href="#how-it-works" className="hover:text-foreground">
            How it works
          </a>
        </div>
      </div>
    </footer>
  );
}
