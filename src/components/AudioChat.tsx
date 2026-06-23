import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Loader2, Sparkles, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { AudioAnalysis } from "@/components/AnalysisPane";

interface AudioChatProps {
  transcriptionId: string;
  transcription: string;
  translation: string;
  analysis: AudioAnalysis | null;
  fileName: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Summarize the key points",
  "What are the action items?",
  "Explain any technical terms used",
  "What's the overall sentiment?",
];

export function AudioChat({ transcriptionId, transcription, translation, analysis, fileName }: AudioChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load saved chat history when transcription changes
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    if (!transcriptionId) return;
    setLoadingHistory(true);
    (async () => {
      const { data, error } = await supabase
        .from("audio_chat_messages")
        .select("role, content")
        .eq("transcription_id", transcriptionId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (!error && data) {
        setMessages(
          data.map((d) => ({ role: d.role as "user" | "assistant", content: d.content })),
        );
      }
      setLoadingHistory(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [transcriptionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      const userMsg = { role: "user" as const, content: trimmed };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput("");
      setLoading(true);

      // Persist user message
      const { data: userAuth } = await supabase.auth.getUser();
      const uid = userAuth.user?.id;
      if (uid) {
        await supabase.from("audio_chat_messages").insert({
          user_id: uid,
          transcription_id: transcriptionId,
          role: "user",
          content: trimmed,
        });
      }

      try {
        const { data, error } = await supabase.functions.invoke("audio-chat", {
          body: {
            messages: next,
            transcription,
            translation,
            analysis,
            fileName,
          },
        });
        if (error) throw new Error(error.message || "Chat failed");
        if (data?.error) throw new Error(data.error);
        const reply = data?.reply || "(no response)";
        setMessages([...next, { role: "assistant", content: reply }]);

        if (uid) {
          await supabase.from("audio_chat_messages").insert({
            user_id: uid,
            transcription_id: transcriptionId,
            role: "assistant",
            content: reply,
          });
        }
      } catch (err) {
        toast({
          title: "Chat failed",
          description: err instanceof Error ? err.message : "Could not get answer.",
          variant: "destructive",
        });
        setMessages(next);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, transcriptionId, transcription, translation, analysis, fileName, toast],
  );


  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 z-50 h-14 rounded-full shadow-lg gap-2"
        >
          <MessageSquare className="h-5 w-5" />
          <span className="hidden sm:inline">Chat with Audio</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col w-full sm:max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            AI Chat with Audio
          </SheetTitle>
          <p className="text-xs text-muted-foreground text-left">
            Ask anything about this audio. The AI uses the transcript plus its general knowledge.
          </p>
        </SheetHeader>

        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef as never}>
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border hover:bg-accent transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "flex-row-reverse" : "flex-row",
                )}
              >
                <div
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm max-w-[85%] leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground whitespace-pre-wrap"
                      : "bg-muted text-foreground",
                  )}
                >
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-pre:my-2 prose-code:before:hidden prose-code:after:hidden">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="rounded-lg px-3 py-2 bg-muted flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t bg-background p-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="relative flex items-end rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:border-ring transition-shadow shadow-sm"
          >
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target as HTMLTextAreaElement;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 200) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask about this audio..."
              rows={1}
              className="flex-1 resize-none bg-transparent px-4 py-3 pr-14 text-sm leading-relaxed outline-none placeholder:text-muted-foreground max-h-[200px] overflow-y-auto"
              disabled={loading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim()}
              className="absolute right-2 bottom-2 h-9 w-9 rounded-xl shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground mt-2 px-1">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
