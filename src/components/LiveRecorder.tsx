import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LiveRecorderProps {
  onTranscriptComplete: (args: { text: string; fileName: string }) => void;
  disabled?: boolean;
}

type Phase = "idle" | "recording" | "paused" | "finalizing" | "done";

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

const IDLE_LEVELS = () => Array(28).fill(0.15);

export function LiveRecorder({ onTranscriptComplete, disabled }: LiveRecorderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [levels, setLevels] = useState<number[]>(IDLE_LEVELS);
  const [supported, setSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const accumulatedMsRef = useRef(0);
  const finalTextRef = useRef<string>("");
  const interimTextRef = useRef("");
  const stoppingRef = useRef(false);
  const pausedRef = useRef(false);
  const finalizedRef = useRef(false);
  const onTranscriptCompleteRef = useRef(onTranscriptComplete);

  const { toast } = useToast();

  onTranscriptCompleteRef.current = onTranscriptComplete;

  useEffect(() => {
    setSupported(!!getSpeechRecognition());
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const stopLevels = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setLevels(IDLE_LEVELS());
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    startedAtRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((accumulatedMsRef.current + Date.now() - startedAtRef.current) / 1000));
    }, 250);
  }, [stopTimer]);

  const cleanup = useCallback(() => {
    stopTimer();
    stopLevels();
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
  }, [stopTimer, stopLevels]);

  useEffect(() => () => cleanup(), [cleanup]);

  const flushInterim = useCallback(() => {
    const interim = interimTextRef.current.trim();
    if (!interim) return;
    finalTextRef.current = (finalTextRef.current + " " + interim).replace(/\s+/g, " ").trim();
    setFinalText(finalTextRef.current);
    interimTextRef.current = "";
    setInterimText("");
  }, []);

  const finalizeRecording = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    flushInterim();
    const text = finalTextRef.current.trim();
    cleanup();
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
    onTranscriptCompleteRef.current({ text, fileName });
  }, [cleanup, flushInterim, toast]);

  const animateLevels = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser || pausedRef.current) return;
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
    if (phase === "recording" || phase === "paused" || phase === "finalizing") return;
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
    interimTextRef.current = "";
    setElapsed(0);
    accumulatedMsRef.current = 0;
    stoppingRef.current = false;
    pausedRef.current = false;
    finalizedRef.current = false;

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
      interimTextRef.current = interim.trim();
      setInterimText(interimTextRef.current);
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
      // Stay paused — resume() will start recognition again
      if (pausedRef.current) {
        flushInterim();
        return;
      }
      // Auto-restart while user is still recording (some browsers stop early)
      if (!stoppingRef.current && recognitionRef.current) {
        try { recognitionRef.current.start(); } catch { /* ignore */ }
        return;
      }
      finalizeRecording();
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (err) { console.error(err); }

    startTimer();
    setPhase("recording");
    animateLevels();
  }, [phase, toast, animateLevels, startTimer, finalizeRecording, flushInterim]);

  const handlePause = useCallback(() => {
    if (phase !== "recording") return;
    pausedRef.current = true;
    accumulatedMsRef.current += Date.now() - startedAtRef.current;
    stopTimer();
    stopLevels();
    setElapsed(Math.floor(accumulatedMsRef.current / 1000));
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = false;
    });
    audioCtxRef.current?.suspend().catch(() => {});
    setPhase("paused");
  }, [phase, stopTimer, stopLevels]);

  const handleResume = useCallback(() => {
    if (phase !== "paused") return;
    pausedRef.current = false;
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = true;
    });
    audioCtxRef.current?.resume().catch(() => {});
    try { recognitionRef.current?.start(); } catch { /* onend will restart if still stopping */ }
    startTimer();
    setPhase("recording");
    animateLevels();
  }, [phase, startTimer, animateLevels]);

  const handleStop = useCallback(() => {
    if (phase !== "recording" && phase !== "paused") return;
    const wasPaused = phase === "paused";
    stoppingRef.current = true;
    pausedRef.current = false;
    setPhase("finalizing");
    if (wasPaused) {
      finalizeRecording();
      return;
    }
    try { recognitionRef.current?.stop(); } catch { /* noop */ }
  }, [phase, finalizeRecording]);

  const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isRecording = phase === "recording";
  const isPaused = phase === "paused";
  const isActive = isRecording || isPaused;
  const isFinalizing = phase === "finalizing";

  return (
    <div className="rounded-lg border border-border bg-card p-8 sm:p-10">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center justify-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center">
            {isActive && (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={isPaused ? handleResume : handlePause}
                disabled={disabled || isFinalizing}
                className="h-12 w-12 rounded-full shadow-sm"
                aria-label={isPaused ? "Resume recording" : "Pause recording"}
              >
                {isPaused ? (
                  <Play className="h-5 w-5 fill-current" />
                ) : (
                  <Pause className="h-5 w-5 fill-current" />
                )}
              </Button>
            )}
          </div>
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
              variant={isActive ? "destructive" : "default"}
              onClick={isActive ? handleStop : handleStart}
              disabled={disabled || isFinalizing || !supported}
              className="relative h-20 w-20 rounded-full shadow-lg transition-transform hover:scale-105"
              aria-label={isActive ? "Stop recording" : "Start recording"}
            >
              {isFinalizing ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : isActive ? (
                <Square className="h-7 w-7 fill-current" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </Button>
          </div>
          <div className="h-12 w-12 shrink-0" aria-hidden />
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
          {isPaused && (
            <p className="text-base font-medium text-muted-foreground flex items-center justify-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground" />
              Paused — {mmss(elapsed)}
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

        {(isActive || isFinalizing || (phase === "done" && finalText)) && (
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
