import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LiveRecorderProps {
  onTranscriptComplete: (args: { text: string; fileName: string }) => void;
  disabled?: boolean;
}

type Phase = "idle" | "recording" | "transcribing" | "done";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function LiveRecorder({ onTranscriptComplete, disabled }: LiveRecorderProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [levels, setLevels] = useState<number[]>(() => Array(28).fill(0.15));

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);

  const { toast } = useToast();

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
    mediaRecorderRef.current = null;
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
    if (phase !== "idle" && phase !== "done") return;
    setLiveText("");
    setElapsed(0);

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

    const mimeType = ["audio/webm", "audio/mp4"].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    if (!mimeType) {
      stream.getTracks().forEach((t) => t.stop());
      toast({
        title: "Unsupported browser",
        description: "This browser can't record a supported audio format.",
        variant: "destructive",
      });
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
      cleanup();
      if (blob.size < 1024) {
        toast({
          title: "Recording too short",
          description: "Please record at least a second of audio.",
          variant: "destructive",
        });
        setPhase("idle");
        return;
      }
      await streamTranscribe(blob, recorder.mimeType);
    };
    mediaRecorderRef.current = recorder;

    // Audio visualization
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    startedAtRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 250);

    recorder.start();
    setPhase("recording");
    animateLevels();
  }, [phase, toast, animateLevels, cleanup]);

  const streamTranscribe = useCallback(
    async (blob: Blob, mime: string) => {
      setPhase("transcribing");
      setLiveText("");

      const form = new FormData();
      const ext =
        mime.includes("mp4") ? "mp4" : mime.includes("mpeg") ? "mp3" : "webm";
      const fileName = `recording-${new Date().toISOString().replace(/[:.]/g, "-")}.${ext}`;
      form.append("file", blob, fileName);

      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/transcribe-stream`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: form,
        });

        if (!res.ok || !res.body) {
          const errBody = await res.json().catch(() => ({ error: "Transcription failed" }));
          throw new Error(errBody.error || "Transcription failed");
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let finalText = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const raw of lines) {
            const line = raw.trim();
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const evt = JSON.parse(payload);
              if (evt.type === "transcript.text.delta" && typeof evt.delta === "string") {
                finalText += evt.delta;
                setLiveText(finalText);
              } else if (evt.type === "transcript.text.done" && typeof evt.text === "string") {
                finalText = evt.text;
                setLiveText(finalText);
              }
            } catch {
              /* ignore malformed */
            }
          }
        }

        setPhase("done");
        if (finalText.trim().length > 0) {
          onTranscriptComplete({ text: finalText.trim(), fileName });
        } else {
          toast({
            title: "No speech detected",
            description: "We couldn't hear anything. Try again.",
            variant: "destructive",
          });
        }
      } catch (e) {
        console.error("Stream transcribe error:", e);
        toast({
          title: "Transcription failed",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
        setPhase("idle");
      }
    },
    [onTranscriptComplete, toast],
  );

  const handleStop = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  const mmss = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const isRecording = phase === "recording";
  const isTranscribing = phase === "transcribing";

  return (
    <div className="rounded-lg border border-border bg-card p-8 sm:p-10">
      <div className="flex flex-col items-center gap-6">
        {/* Mic button + pulsing ring */}
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
            disabled={disabled || isTranscribing}
            className="relative h-20 w-20 rounded-full shadow-lg transition-transform hover:scale-105"
            aria-label={isRecording ? "Stop recording" : "Start recording"}
          >
            {isTranscribing ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : isRecording ? (
              <Square className="h-7 w-7 fill-current" />
            ) : (
              <Mic className="h-8 w-8" />
            )}
          </Button>
        </div>

        {/* Status text */}
        <div className="text-center">
          {phase === "idle" && (
            <p className="text-base font-medium text-foreground">Tap the mic to start recording</p>
          )}
          {isRecording && (
            <p className="text-base font-medium text-destructive flex items-center justify-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" />
              Recording — {mmss(elapsed)}
            </p>
          )}
          {isTranscribing && (
            <p className="text-base font-medium text-primary">Transcribing live…</p>
          )}
          {phase === "done" && (
            <p className="text-base font-medium text-foreground">Done. Tap mic to record again.</p>
          )}
        </div>

        {/* Waveform */}
        <div className="flex h-16 w-full max-w-md items-center justify-center gap-1">
          {levels.map((lvl, i) => (
            <span
              key={i}
              className={cn(
                "w-1.5 rounded-full transition-all duration-75",
                isRecording ? "bg-primary" : "bg-muted",
              )}
              style={{
                height: `${(isRecording ? lvl : 0.15) * 100}%`,
                minHeight: 4,
              }}
            />
          ))}
        </div>

        {/* Live transcript */}
        {(isTranscribing || (phase === "done" && liveText)) && (
          <div className="w-full rounded-md border border-border bg-muted/40 p-4 min-h-[100px] max-h-64 overflow-y-auto">
            <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
              {liveText.split(/(\s+)/).map((token, i) =>
                /\s+/.test(token) ? (
                  token
                ) : (
                  <span key={i} className="inline-block animate-fade-in">
                    {token}
                  </span>
                ),
              )}
              {isTranscribing && (
                <span className="ml-1 inline-block h-4 w-0.5 bg-primary align-middle animate-pulse" />
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
