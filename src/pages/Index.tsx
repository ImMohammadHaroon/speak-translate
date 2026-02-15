import { useState, useCallback, useEffect } from "react";
import { AudioUploadZone } from "@/components/AudioUploadZone";
import { ProcessingStatus, type ProcessingStep } from "@/components/ProcessingStatus";
import { ResultsPane } from "@/components/ResultsPane";
import { TranscriptionHistory } from "@/components/TranscriptionHistory";
import { fileToBase64 } from "@/lib/audio-utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

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
  const { toast } = useToast();
  const { signOut, user } = useAuth();

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from("transcriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
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

      // Save to history
      await supabase.from("transcriptions").insert({
        user_id: user?.id,
        file_name: file.name,
        detected_language: lang,
        transcription: rawTranscription,
        translation: translationText,
        is_english: sourceIsEnglish,
      });
      fetchHistory();
    } catch (err: any) {
      console.error("Processing error:", err);
      setStep("error");
      setErrorMessage(err.message || "An unexpected error occurred");
      toast({
        title: "Processing Failed",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }, [toast, user, fetchHistory]);

  const handleSelectHistory = useCallback((record: TranscriptionRecord) => {
    setTranscription(record.transcription);
    setTranslation(record.translation || "");
    setDetectedLanguage(record.detected_language || "Unknown");
    setIsEnglish(record.is_english);
    setFileName(record.file_name);
    setStep("done");
  }, []);

  const handleDeleteHistory = useCallback(async (id: string) => {
    await supabase.from("transcriptions").delete().eq("id", id);
    fetchHistory();
    toast({ title: "Deleted", description: "Transcription removed from history." });
  }, [fetchHistory, toast]);

  const showResults = step === "done" && transcription;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-end px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>
      <main className="mx-auto max-w-4xl px-4 pb-12 sm:px-6 sm:pb-20">
        <header className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center">
            <img src="/owl-favicon.png" alt="Devowl logo" className="h-14 w-14" />
          </div>
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

        {step !== "idle" && (
          <section className="mb-8">
            <ProcessingStatus currentStep={step} errorMessage={errorMessage} />
          </section>
        )}

        {showResults && (
          <section className="mb-8">
            <ResultsPane
              transcription={transcription}
              translation={translation}
              isEnglish={isEnglish}
              detectedLanguage={detectedLanguage}
            />
          </section>
        )}

        {history.length > 0 && (
          <section>
            <TranscriptionHistory
              records={history}
              onSelect={handleSelectHistory}
              onDelete={handleDeleteHistory}
            />
          </section>
        )}
      </main>
    </div>
  );
};

export default Index;
