import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Mic,
  Languages,
  Sparkles,
  MessageSquare,
  Radio,
  History,
  Upload,
  Brain,
  FileDown,
  Check,
  Star,
  Menu,
  X,
  Github,
  Linkedin,
  Twitter,
  ArrowRight,
  Play,
  Quote,
  Briefcase,
  Globe2,
  Newspaper,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <img src="/owl-favicon.svg" alt="" className="h-8 w-8" />
      <span className="font-semibold text-lg tracking-tight">Transcriptor</span>
    </Link>
  );
}

function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-border/60"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Button asChild size="sm">
              <Link to="/app">Open App</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Start Free</Link>
              </Button>
            </>
          )}
          <button
            className="md:hidden p-2"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border/60 bg-background/95 backdrop-blur-xl">
          <div className="px-4 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function HeroVisual() {
  // 3D-ish floating orb with animated waveform bars
  const bars = Array.from({ length: 32 });
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      {/* glow */}
      <div className="absolute inset-0 rounded-full bg-primary/30 blur-3xl" />
      <div className="absolute inset-8 rounded-full bg-accent/20 blur-2xl" />

      {/* rotating ring */}
      <motion.div
        className="absolute inset-4 rounded-full border border-primary/30"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        style={{ transformStyle: "preserve-3d" }}
      />
      <motion.div
        className="absolute inset-12 rounded-full border border-accent/40"
        animate={{ rotate: -360 }}
        transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
      />

      {/* central 3d orb */}
      <motion.div
        className="absolute inset-16 rounded-full shadow-2xl"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, hsl(var(--primary)/0.9), hsl(var(--primary)/0.5) 50%, hsl(var(--background)) 100%)",
        }}
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-end gap-1 h-20">
            {bars.map((_, i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-primary-foreground/90"
                animate={{
                  height: [
                    `${10 + Math.random() * 60}%`,
                    `${20 + Math.random() * 80}%`,
                    `${10 + Math.random() * 60}%`,
                  ],
                }}
                transition={{
                  duration: 1.2 + Math.random(),
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.03,
                }}
                style={{ height: "30%" }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* floating chips */}
      <motion.div
        className="absolute -top-2 right-4 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-medium shadow-lg flex items-center gap-1.5"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Languages className="h-3 w-3 text-primary" /> Auto-translate
      </motion.div>
      <motion.div
        className="absolute bottom-4 -left-2 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-medium shadow-lg flex items-center gap-1.5"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <Sparkles className="h-3 w-3 text-accent" /> AI Summary
      </motion.div>
      <motion.div
        className="absolute top-1/2 -right-4 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-medium shadow-lg flex items-center gap-1.5"
        animate={{ x: [0, 6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Mic className="h-3 w-3 text-primary" /> Live record
      </motion.div>
    </div>
  );
}

function Hero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 80]);

  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden">
      {/* background gradient blobs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-40 right-1/4 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.div
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 backdrop-blur px-3 py-1 text-xs font-medium mb-6"
          >
            <Sparkles className="h-3 w-3 text-accent" />
            Powered by Gemini 2.5 Flash
          </motion.div>
          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]"
          >
            Turn any audio into{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              actionable insight
            </span>
            .
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg text-muted-foreground max-w-xl"
          >
            For professionals, researchers, and multilingual teams — Transcriptor
            captures every word, translates it fluently, and surfaces what matters.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="rounded-full">
              <Link to="/signup">
                Start Transcribing Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a href="#demo">
                <Play className="h-4 w-4" /> See It In Action
              </a>
            </Button>
          </motion.div>
          <motion.p variants={fadeUp} className="mt-4 text-xs text-muted-foreground">
            No credit card · Free forever plan · 25MB per file
          </motion.p>
        </motion.div>

        <motion.div style={{ y }} className="relative">
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  );
}

function SocialProof() {
  const logos = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"];
  return (
    <section className="py-12 border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-center text-sm text-muted-foreground mb-8">
          Trusted by <span className="font-semibold text-foreground">10,000+</span> creators
          across 40+ languages
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-60">
          {logos.map((l) => (
            <span key={l} className="text-xl font-serif tracking-wide">
              {l}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProblemSolution() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Stop drowning in audio. Start understanding it.
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border bg-card/50 p-8"
          >
            <div className="text-xs uppercase tracking-wider text-destructive font-semibold mb-3">
              Without Transcriptor
            </div>
            <ul className="space-y-4 text-muted-foreground">
              {[
                "Hours scrubbing recordings to find one quote",
                "Manual notes that miss half the conversation",
                "Language barriers blocking insight",
                "Action items lost in voice memos",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <X className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/5 p-8 shadow-lg"
          >
            <div className="text-xs uppercase tracking-wider text-primary font-semibold mb-3">
              With Transcriptor
            </div>
            <ul className="space-y-4">
              {[
                "Searchable transcripts in seconds",
                "Native-script accuracy across 40+ languages",
                "Fluent English translation built in",
                "Summaries, action items, and decisions auto-extracted",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Mic, title: "Native-Script Transcription", desc: "Urdu in Nastaliq, Arabic in Arabic — preserved, never transliterated." },
  { icon: Languages, title: "Fluent English Translation", desc: "Every transcript translated with context and tone intact." },
  { icon: Sparkles, title: "Structured AI Analysis", desc: "Summaries, decisions, action items, deadlines — auto-extracted." },
  { icon: MessageSquare, title: "Chat With Your Audio", desc: "Ask questions, get answers grounded in your recording." },
  { icon: Radio, title: "Live Browser Recording", desc: "Record straight from your mic with real-time transcription." },
  { icon: History, title: "50-Session History", desc: "Every transcript, translation, and chat saved and searchable." },
];

function Features() {
  return (
    <section id="features" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="text-sm font-semibold text-primary mb-3">Features</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to understand audio
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-xl"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const steps = [
  { icon: Upload, title: "Upload or Record", desc: "Drop an audio file or hit record. MP3, WAV, M4A — up to 25MB." },
  { icon: Brain, title: "AI Processes Everything", desc: "Gemini transcribes in native script, translates to English, and analyzes structure." },
  { icon: FileDown, title: "Read, Chat, Export", desc: "Explore insights, chat with your audio, export as TXT — all in one place." },
];

function HowItWorks() {
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="text-sm font-semibold text-primary mb-3">How It Works</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            From audio to insight in three steps
          </h2>
        </motion.div>

        <div className="relative grid md:grid-cols-3 gap-8">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-card border border-border shadow-lg mb-6">
                <s.icon className="h-10 w-10 text-primary" />
                <span className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-semibold text-xl mb-2">{s.title}</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoPreview() {
  return (
    <section id="demo" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <div className="text-sm font-semibold text-primary mb-3">See It</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            A workspace built for clarity
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
        >
          {/* fake window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border bg-muted/50">
            <span className="h-3 w-3 rounded-full bg-destructive/60" />
            <span className="h-3 w-3 rounded-full bg-accent/60" />
            <span className="h-3 w-3 rounded-full bg-primary/60" />
          </div>
          {/* fake app screenshot */}
          <div className="grid md:grid-cols-3 min-h-[400px]">
            <div className="border-r border-border p-4 space-y-2 bg-muted/20">
              <div className="text-xs font-semibold text-muted-foreground mb-3">HISTORY</div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-lg p-3 hover:bg-muted/50 cursor-default">
                  <div className="text-sm font-medium truncate">Recording {i}.mp3</div>
                  <div className="text-xs text-muted-foreground">Today · 3 min</div>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs text-muted-foreground">Processing complete</span>
              </div>
              <div className="space-y-3">
                <div className="h-3 rounded bg-muted w-3/4" />
                <div className="h-3 rounded bg-muted w-full" />
                <div className="h-3 rounded bg-muted w-5/6" />
                <div className="h-3 rounded bg-muted w-2/3" />
              </div>
              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                <div className="text-xs font-semibold text-primary mb-2">AI SUMMARY</div>
                <div className="space-y-2">
                  <div className="h-2 rounded bg-muted w-full" />
                  <div className="h-2 rounded bg-muted w-4/5" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <div className="rounded-full bg-primary/10 text-primary text-xs px-3 py-1">
                  ✓ 3 action items
                </div>
                <div className="rounded-full bg-accent/10 text-accent-foreground text-xs px-3 py-1">
                  2 decisions
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const useCases = [
  { icon: Briefcase, title: "Professionals", desc: "Turn meetings into action items and decisions without lifting a pen." },
  { icon: Globe2, title: "Multilingual Speakers", desc: "Speak your language. Share it in English. Keep both versions." },
  { icon: Newspaper, title: "Researchers & Journalists", desc: "Searchable interviews with quotes, summaries, and timestamps." },
  { icon: Headphones, title: "On-the-Go Note Takers", desc: "Record a thought, get a polished transcript before you land." },
];

function UseCases() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="text-sm font-semibold text-primary mb-3">Built For</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Whoever needs to hear, understand, and act
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {useCases.map((u) => (
            <motion.div
              key={u.title}
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="rounded-2xl border border-border bg-card p-6 hover:border-primary/50 transition-all"
            >
              <u.icon className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">{u.title}</h3>
              <p className="text-sm text-muted-foreground">{u.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const tiers = [
  {
    name: "Free",
    price: "$0",
    desc: "Get started with the essentials.",
    features: ["5 transcriptions / month", "Up to 25MB per file", "English translation", "AI summary"],
    cta: "Start Free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$12",
    desc: "For serious creators and pros.",
    features: ["Unlimited transcriptions", "Up to 100MB per file", "Full AI analysis suite", "Chat with audio", "50-session history"],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "$39",
    desc: "Collaboration for teams of 5+.",
    features: ["Everything in Pro", "Shared workspace", "Roles & permissions", "Priority support", "Custom retention"],
    cta: "Contact Sales",
    highlighted: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="text-sm font-semibold text-primary mb-3">Pricing</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Simple plans that scale with you
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tiers.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={cn(
                "relative rounded-3xl border p-8 flex flex-col",
                t.highlighted
                  ? "border-primary bg-gradient-to-b from-primary/10 to-card shadow-2xl scale-105 md:scale-110"
                  : "border-border bg-card"
              )}
            >
              {t.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="font-semibold text-xl">{t.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">{t.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{t.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                variant={t.highlighted ? "default" : "outline"}
                className="w-full rounded-full"
              >
                <Link to="/signup">{t.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const testimonials = [
  { name: "Ayesha K.", role: "Product Manager", quote: "I get an entire meeting's worth of decisions and action items in 30 seconds. It changed how my team works." },
  { name: "Daniel R.", role: "Journalist", quote: "I record an interview in Urdu, get a flawless transcript plus an English translation. It's surreal." },
  { name: "Lin W.", role: "Researcher", quote: "The chat-with-audio feature is the killer one. I ask questions to my interviews now." },
];

function Testimonials() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="text-sm font-semibold text-primary mb-3">Loved By Users</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Don't take our word for it
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.15 }}
          variants={stagger}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.name}
              variants={fadeUp}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <Quote className="h-6 w-6 text-primary/40 mb-3" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-foreground mb-6 flex-1">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const faqs = [
  { q: "What languages does Transcriptor support?", a: "40+ languages with native-script accuracy, including Urdu, Arabic, Hindi, Chinese, Japanese, and all major European languages. Every transcript is also translated into fluent English." },
  { q: "What's the maximum file size?", a: "Free and Pro plans support up to 25MB per file (about 10 minutes of audio). Team plans support up to 100MB." },
  { q: "Is my audio private?", a: "Yes. Files are processed and stored under your account. We never use your audio to train models." },
  { q: "What audio formats are supported?", a: "MP3, WAV, M4A, OGG, and FLAC." },
  { q: "How accurate is the AI?", a: "We use Google's Gemini 2.5 Flash for transcription and analysis — state-of-the-art accuracy across languages and accents." },
  { q: "Can I cancel anytime?", a: "Yes. Pro and Team plans are month-to-month with no commitment. You can cancel from your dashboard at any time." },
  { q: "Does the free plan have a time limit?", a: "Nope, free forever. You get 5 transcriptions a month with all the core features." },
  { q: "Can I export my transcripts?", a: "Yes — TXT export on every plan, with more formats coming soon." },
];

function FAQ() {
  return (
    <section id="faq" className="py-24 bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <div className="text-sm font-semibold text-primary mb-3">FAQ</div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Questions, answered
          </h2>
        </motion.div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary to-accent p-12 md:p-16 text-center shadow-2xl"
        >
          <div className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 30%, hsl(var(--primary-foreground)) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <h2 className="relative text-3xl sm:text-5xl font-bold tracking-tight text-primary-foreground">
            Turn your audio into insight in seconds.
          </h2>
          <p className="relative mt-4 text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Join 10,000+ creators who never miss a word.
          </p>
          <div className="relative mt-8">
            <Button asChild size="lg" variant="secondary" className="rounded-full">
              <Link to="/signup">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              Turn any audio into accurate transcripts, fluent translations, and AI-powered insight.
            </p>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3">Product</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#pricing" className="hover:text-foreground">Pricing</a></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-sm mb-3">Company</div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-foreground">Terms</a></li>
              <li><a href="#" className="hover:text-foreground">Contact</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Devowl Transcriptor. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a href="#" aria-label="LinkedIn" className="hover:text-foreground"><Linkedin className="h-4 w-4" /></a>
            <a href="#" aria-label="GitHub" className="hover:text-foreground"><Github className="h-4 w-4" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-foreground"><Twitter className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        <ProblemSolution />
        <Features />
        <HowItWorks />
        <DemoPreview />
        <UseCases />
        <Pricing />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
