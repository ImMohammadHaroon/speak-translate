import { useState, useCallback, useEffect } from "react";
import { AudioUploadZone } from "@/components/AudioUploadZone";
import { LiveRecorder } from "@/components/LiveRecorder";
import { ProcessingStatus, type ProcessingStep } from "@/components/ProcessingStatus";
import { ResultsPane } from "@/components/ResultsPane";
import { HistorySidebar } from "@/components/HistorySidebar";
import { fileToBase64 } from "@/lib/audio-utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, Upload as UploadIcon, Mic } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TranscriptionRecord {
  id: string;
  file_name: string;
  detected_language: string | null;
  transcription: string;
  translation: string | null;
  is_english: boolean;
  created_at: string;
}

const Index = () => {
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [translation, setTranslation] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [isEnglish, setIsEnglish] = useState(false);
  const [fileName, setFileName] = useState("");
  const [history, setHistory] = useState<TranscriptionRecord[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string>();
  const { toast } = useToast();
  const { signOut, user } = useAuth();

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from("transcriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data as TranscriptionRecord[]);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const processAudio = useCallback(async (file: File) => {
    setStep("uploading");
    setErrorMessage("");
    setTranscription("");
    setTranslation("");
    setDetectedLanguage("");
    setIsEnglish(false);
    setFileName(file.name);
    setActiveHistoryId(undefined);

    try {
      const audioBase64 = await fileToBase64(file);

      setStep("transcribing");
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        "transcribe",
        { body: { audioBase64, mimeType: file.type, fileName: file.name } }
      );

      if (transcribeError) throw new Error(transcribeError.message || "Transcription failed");
      if (transcribeData?.error) throw new Error(transcribeData.error);

      let rawTranscription = transcribeData.transcription || "";

      let lang = "Unknown";
      const langMatch = rawTranscription.match(/\[Language:\s*(.+?)\]/i);
      if (langMatch) {
        lang = langMatch[1].trim();
        rawTranscription = rawTranscription.replace(/\[Language:\s*.+?\]\s*/i, "").trim();
      }
      setDetectedLanguage(lang);
      setTranscription(rawTranscription);

      setStep("translating");
      const { data: translateData, error: translateError } = await supabase.functions.invoke(
        "translate",
        { body: { text: rawTranscription, detectedLanguage: lang } }
      );

      if (translateError) throw new Error(translateError.message || "Translation failed");
      if (translateData?.error) throw new Error(translateData.error);

      const translationText = translateData.translation || "";
      const sourceIsEnglish = lang.toLowerCase().includes("english") || !!translateData.isEnglish;

      setTranslation(translationText);
      setIsEnglish(sourceIsEnglish);
      setStep("done");

      await supabase.from("transcriptions").insert({
        user_id: user?.id,
        file_name: file.name,
        detected_language: lang,
        transcription: rawTranscription,
        translation: translationText,
        is_english: sourceIsEnglish,
      });
      fetchHistory();
    } catch (err: unknown) {
      console.error("Processing error:", err);
      setStep("error");
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(message);
      toast({
        title: "Processing Failed",
        description: message,
        variant: "destructive",
      });
    }
  }, [toast, user, fetchHistory]);

  const processRecordedText = useCallback(
    async ({ text, fileName: recName }: { text: string; fileName: string }) => {
      setStep("translating");
      setErrorMessage("");
      setFileName(recName);
      setActiveHistoryId(undefined);
      setTranscription(text);

      try {
        const { data: translateData, error: translateError } = await supabase.functions.invoke(
          "translate",
          { body: { text, detectedLanguage: "Unknown" } },
        );
        if (translateError) throw new Error(translateError.message || "Translation failed");
        if (translateData?.error) throw new Error(translateData.error);

        const translationText = translateData.translation || "";
        const sourceIsEnglish = !!translateData.isEnglish;
        const lang = translateData.detectedLanguage || "Unknown";

        setTranslation(translationText);
        setIsEnglish(sourceIsEnglish);
        setDetectedLanguage(lang);
        setStep("done");

        await supabase.from("transcriptions").insert({
          user_id: user?.id,
          file_name: recName,
          detected_language: lang,
          transcription: text,
          translation: translationText,
          is_english: sourceIsEnglish,
        });
        fetchHistory();
      } catch (err: unknown) {
        console.error("Recorded text processing error:", err);
        setStep("error");
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setErrorMessage(message);
        toast({ title: "Processing Failed", description: message, variant: "destructive" });
      }
    },
    [toast, user, fetchHistory],
  );

  const handleSelectHistory = useCallback((record: TranscriptionRecord) => {
    setTranscription(record.transcription);
    setTranslation(record.translation || "");
    setDetectedLanguage(record.detected_language || "Unknown");
    setIsEnglish(record.is_english);
    setFileName(record.file_name);
    setActiveHistoryId(record.id);
    setStep("done");
  }, []);

  const handleDeleteHistory = useCallback(async (id: string) => {
    await supabase.from("transcriptions").delete().eq("id", id);
    if (activeHistoryId === id) {
      setStep("idle");
      setTranscription("");
      setTranslation("");
      setActiveHistoryId(undefined);
    }
    fetchHistory();
    toast({ title: "Deleted", description: "Transcription removed." });
  }, [fetchHistory, toast, activeHistoryId]);

  const handleNewTranscription = useCallback(() => {
    setStep("idle");
    setTranscription("");
    setTranslation("");
    setDetectedLanguage("");
    setIsEnglish(false);
    setFileName("");
    setActiveHistoryId(undefined);
    setErrorMessage("");
  }, []);

  const showResults = step === "done" && transcription;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <HistorySidebar
          records={history}
          onSelect={handleSelectHistory}
          onDelete={handleDeleteHistory}
          onNewTranscription={handleNewTranscription}
          activeId={activeHistoryId}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 border-b border-border">
            <SidebarTrigger />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>

          <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
            {!showResults && (
              <>
                <header className="mb-10 text-center">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Devowl Transcriptor
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    Upload any audio file — get an accurate transcription and English translation in seconds.
                  </p>
                </header>

                <section className="mb-8">
                  <AudioUploadZone
                    onFileSelected={processAudio}
                    isProcessing={step !== "idle" && step !== "done" && step !== "error"}
                  />
                </section>
              </>
            )}

            {step !== "idle" && step !== "done" && (
              <section className="mb-8">
                <ProcessingStatus currentStep={step} errorMessage={errorMessage} />
              </section>
            )}

            {showResults && (
              <section>
                <ResultsPane
                  transcription={transcription}
                  translation={translation}
                  isEnglish={isEnglish}
                  detectedLanguage={detectedLanguage}
                />
              </section>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
