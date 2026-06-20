import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LiveRecorderProps {
  onTranscriptComplete: (args: { text: string; fileName: string }) => void;
  disabled?: boolean;
}

type Phase = "idle" | "recording" | "finalizing" | "done";

// Minimal types for the Web Speech API (not in lib.dom)
interface SRAlternative { transcript: string }
interface SRResult { 0: SRAlternative; isFinal: boolean; length: number }
interface SREvent extends Event {
  resultIndex: number;
  results: { length: number; [i: number]: SRResult };
}
interface SRErrorEvent extends Event { error: string }
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SREvent) => void) | null;
  onerror: ((e: SRErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SRCtor = new () => SpeechRecognitionLike;

function getSpeechRecognition(): SRCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SRCtor;
    webkitSpeechRecognition?: SRCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function LiveRecorder({ onTranscriptComplete, disabled }: LiveRecorderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [levels, setLevels] = useState<number[]>(() => Array(28).fill(0.15));
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const finalTextRef = useRef<string>("");
  const stoppingRef = useRef(false);

  const { toast } = useToast();

  useEffect(() => {
    setSupported(!!getSpeechRecognition());
  }, []);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (timerRef.current) window.clearInterval(timerRef.current);
    rafRef.current = null;
    timerRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* noop */ }
      recognitionRef.current = null;
    }
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const animateLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    const bars = 28;
    const step = Math.floor(data.length / bars);
    const next: number[] = [];
    for (let i = 0; i < bars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) sum += data[i * step + j] ?? 0;
      const avg = sum / step / 255;
      next.push(Math.max(0.08, Math.min(1, avg * 1.6)));
    }
    setLevels(next);
    rafRef.current = requestAnimationFrame(animateLevels);
  }, []);

  const handleStart = useCallback(async () => {
    if (phase === "recording" || phase === "finalizing") return;
    const SR = getSpeechRecognition();
    if (!SR) {
      toast({
        title: "Live transcription not supported",
        description:
          "Your browser doesn't support live speech recognition. Use Chrome, Edge, or Safari.",
        variant: "destructive",
      });
      return;
    }

    setFinalText("");
    setInterimText("");
    finalTextRef.current = "";
    setElapsed(0);
    stoppingRef.current = false;

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({
        title: "Microphone blocked",
        description: "Please allow microphone access to record.",
        variant: "destructive",
      });
      return;
    }
    streamRef.current = stream;

    // Audio visualization
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    // Speech recognition
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event: SREvent) => {
      let interim = "";
      let appended = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const txt = res[0].transcript;
        if (res.isFinal) appended += txt;
        else interim += txt;
      }
      if (appended) {
        finalTextRef.current = (finalTextRef.current + " " + appended).replace(/\s+/g, " ").trim();
        setFinalText(finalTextRef.current);
      }
      setInterimText(interim.trim());
    };

    recognition.onerror = (e: SRErrorEvent) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      console.error("SpeechRecognition error:", e.error);
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        toast({
          title: "Microphone blocked",
          description: "Please allow microphone access in your browser.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      // Auto-restart while user is still recording (some browsers stop early)
      if (!stoppingRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ignore */ }
        return;
      }
      // User stopped — finalize
      const text = (finalTextRef.current + " " + (interimText || "")).trim();
      cleanup();
      setInterimText("");
      if (text.length === 0) {
        toast({
          title: "No speech detected",
          description: "We couldn't hear anything. Try again.",
          variant: "destructive",
        });
        setPhase("idle");
        return;
      }
      setPhase("done");
      const fileName = `live-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`;
      onTranscriptComplete({ text, fileName });
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (err) { console.error(err); }

    startedAtRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);

    setPhase("recording");
    animateLevels();
  }, [phase, toast, animateLevels, cleanup, onTranscriptComplete, interimText]);

  const handleStop = useCallback(() => {
    if (phase !== "recording") return;
    stoppingRef.current = true;
    setPhase("finalizing");
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  }, [phase]);

  const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isRecording = phase === "recording";
  const isFinalizing = phase === "finalizing";
  const liveDisplay = (finalText + (interimText ? " " + interimText : "")).trim();

  return (
    <div className="rounded-lg border border-border bg-card p-8 sm:p-10">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          {isRecording && (
            <>
              <span className="absolute inset-0 -m-3 rounded-full bg-destructive/20 animate-ping" />
              <span className="absolute inset-0 -m-1 rounded-full bg-destructive/30 animate-pulse" />
            </>
          )}
          <Button
            type="button"
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? handleStop : handleStart}
            disabled={disabled || isFinalizing || !supported}
            className="relative h-20 w-20 rounded-full shadow-lg transition-transform hover:scale-105"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isFinalizing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isRecording ? (
              <Square className="h-7 w-7 fill-current" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>

        <div className="text-center">
          {!supported && (
            <p className="text-sm text-destructive">
              Live transcription isn't supported in this browser. Try Chrome, Edge, or Safari.
            </p>
          )}
          {supported && phase === "idle" && (
            <p className="text-base font-medium text-foreground">Tap the mic and start speaking</p>
          )}
          {isRecording && (
            <p className="text-base font-medium text-destructive flex items-center justify-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Listening — {mmss(elapsed)}
            </p>
          )}
          {isFinalizing && (
            <p className="text-base font-medium text-primary">Finishing up & translating…</p>
          )}
          {phase === "done" && (
            <p className="text-base font-medium text-foreground">Done. Tap mic to record again.</p>
          )}
        </div>

        <div className="flex h-16 w-full max-w-md items-center justify-center gap-1">
          {levels.map((lvl, i) => (
            <span
              key={i}
              className={cn(
                "w-1.5 rounded-full transition-all duration-75",
                isRecording ? "bg-primary" : "bg-muted",
              )}
              style={{ height: `${(isRecording ? lvl : 0.15) * 100}%`, minHeight: 4 }}
            />
          ))}
        </div>

        {(isRecording || isFinalizing || (phase === "done" && finalText)) && (
          <div className="w-full rounded-md border border-border bg-muted/40 p-4 min-h-[100px] max-h-64 overflow-y-auto">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {finalText.split(/(\s+)/).map((token, i) =>
                /\s+/.test(token) ? (
                  token
                ) : (
                  <span key={`f-${i}`} className="inline-block animate-fade-in text-foreground">
                    {token}
                  </span>
                ),
              )}
              {interimText && (
                <span className="text-muted-foreground italic">
                  {finalText ? " " : ""}{interimText}
                </span>
              )}
              {isRecording && (
                <span className="ml-1 inline-block h-4 w-0.5 bg-primary align-middle animate-pulse" />
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
