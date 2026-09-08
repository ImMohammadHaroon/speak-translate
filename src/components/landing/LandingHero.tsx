import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function LandingHero() {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const animateIn = reduce === false;
  const enter = animateIn
    ? { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } }
    : { initial: false, animate: { opacity: 1 } };

  return (
    <section className="mx-auto grid min-h-[calc(100dvh-4rem)] max-w-[1400px] items-center gap-10 px-4 pb-12 pt-8 md:grid-cols-12 md:gap-8 md:px-8 md:pt-10 lg:gap-12">
      <motion.div
        className="md:col-span-6 lg:col-span-5"
        {...enter}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1 className="max-w-[14ch] font-serif text-4xl font-medium leading-[1.1] tracking-tight text-foreground md:text-5xl lg:text-6xl">
          Every recording, written and translated.
        </h1>
        <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-muted-foreground md:text-lg">
          Upload audio or speak live. Get a transcript, an English translation, and notes you can use.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg" className="active:scale-[0.98]">
            <Link to={user ? "/app" : "/signup"}>{user ? "Open app" : "Get started"}</Link>
          </Button>
          {!user && (
            <Button asChild variant="outline" size="lg" className="active:scale-[0.98]">
              <Link to="/login">Log in</Link>
            </Button>
          )}
        </div>
      </motion.div>

      <motion.div
        className="relative md:col-span-6 lg:col-span-7"
        {...enter}
        transition={{ duration: 0.7, delay: animateIn ? 0.12 : 0, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="overflow-hidden rounded-[var(--radius)] shadow-xl">
          <img
            src="/landing/hero-desk.jpg"
            alt="Olive linen desk with a microphone, cassette recorder, and notebook in warm daylight"
            width={900}
            height={1200}
            className="aspect-[4/5] w-full object-cover sm:aspect-[5/4] lg:aspect-[4/3]"
            fetchPriority="high"
          />
        </div>
        <div className="absolute bottom-4 left-4 right-4 rounded-[calc(var(--radius)-4px)] border border-border bg-card/92 p-4 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-card/80 motion-reduce:static motion-reduce:mt-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[min(100%,22rem)]">
          <p className="font-mono text-[11px] text-muted-foreground">Detected: Spanish</p>
          <p className="mt-2 font-serif text-lg leading-snug text-foreground">
            “The deadline moves to Thursday. Please send the notes tonight.”
          </p>
          <p className="mt-2 text-xs text-muted-foreground">English translation of the spoken clip</p>
        </div>
      </motion.div>
    </section>
  );
}
