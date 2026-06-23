import { useState, useCallback, useEffect } from "react";
import { AudioUploadZone } from "@/components/AudioUploadZone";
import { LiveRecorder } from "@/components/LiveRecorder";
import { ProcessingStatus, type ProcessingStep } from "@/components/ProcessingStatus";
import { ResultsPane } from "@/components/ResultsPane";
import { HistorySidebar } from "@/components/HistorySidebar";
import { AnalysisPane, type AudioAnalysis } from "@/components/AnalysisPane";
import { AudioChat } from "@/components/AudioChat";
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
  analysis: AudioAnalysis | null;
}

const Index = () => {
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [translation, setTranslation] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [isEnglish, setIsEnglish] = useState(false);
  const [fileName, setFileName] = useState("");
  const [analysis, setAnalysis] = useState<AudioAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
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
    if (data) setHistory(data as unknown as TranscriptionRecord[]);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const runAnalysisAndSave = useCallback(
    async ({
      textForAnalysis,
      transcriptionText,
      translationText,
      lang,
      sourceIsEnglish,
      name,
    }: {
      textForAnalysis: string;
      transcriptionText: string;
      translationText: string;
      lang: string;
      sourceIsEnglish: boolean;
      name: string;
    }) => {
      setAnalyzing(true);
      let analysisResult: AudioAnalysis | null = null;
      try {
        const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
          "analyze",
          { body: { text: textForAnalysis } },
        );
        if (analyzeError) throw new Error(analyzeError.message || "Analysis failed");
        if (analyzeData?.error) throw new Error(analyzeData.error);
        analysisResult = (analyzeData?.analysis as AudioAnalysis) ?? null;
        setAnalysis(analysisResult);
      } catch (err) {
        console.error("Analysis error:", err);
        toast({
          title: "AI analysis failed",
          description: err instanceof Error ? err.message : "Could not generate insights.",
          variant: "destructive",
        });
      } finally {
        setAnalyzing(false);
      }

      const { data: inserted } = await supabase.from("transcriptions").insert({
        user_id: user?.id,
        file_name: name,
        detected_language: lang,
        transcription: transcriptionText,
        translation: translationText,
        is_english: sourceIsEnglish,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analysis: analysisResult as any,
      }).select("id").single();
      if (inserted?.id) setActiveHistoryId(inserted.id);
      fetchHistory();
    },
    [toast, user, fetchHistory],
  );

  const processAudio = useCallback(async (file: File) => {
    setStep("uploading");
    setErrorMessage("");
    setTranscription("");
    setTranslation("");
    setDetectedLanguage("");
    setIsEnglish(false);
    setFileName(file.name);
    setAnalysis(null);
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

      await runAnalysisAndSave({
        textForAnalysis: sourceIsEnglish ? translationText || rawTranscription : translationText,
        transcriptionText: rawTranscription,
        translationText,
        lang,
        sourceIsEnglish,
        name: file.name,
      });
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
  }, [toast, runAnalysisAndSave]);

  const processRecordedText = useCallback(
    async ({ text, fileName: recName }: { text: string; fileName: string }) => {
      setStep("translating");
      setErrorMessage("");
      setFileName(recName);
      setAnalysis(null);
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

        await runAnalysisAndSave({
          textForAnalysis: translationText || text,
          transcriptionText: text,
          translationText,
          lang,
          sourceIsEnglish,
          name: recName,
        });
      } catch (err: unknown) {
        console.error("Recorded text processing error:", err);
        setStep("error");
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setErrorMessage(message);
        toast({ title: "Processing Failed", description: message, variant: "destructive" });
      }
    },
    [toast, runAnalysisAndSave],
  );

  const handleSelectHistory = useCallback((record: TranscriptionRecord) => {
    setTranscription(record.transcription);
    setTranslation(record.translation || "");
    setDetectedLanguage(record.detected_language || "Unknown");
    setIsEnglish(record.is_english);
    setFileName(record.file_name);
    setAnalysis(record.analysis ?? null);
    setAnalyzing(false);
    setActiveHistoryId(record.id);
    setStep("done");
  }, []);

  const handleDeleteHistory = useCallback(async (id: string) => {
    await supabase.from("transcriptions").delete().eq("id", id);
    if (activeHistoryId === id) {
      setStep("idle");
      setTranscription("");
      setTranslation("");
      setAnalysis(null);
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
    setAnalysis(null);
    setAnalyzing(false);
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
                    Upload any audio file — get an accurate transcription, English translation, and AI-powered insights.
                  </p>
                </header>

                <section className="mb-8">
                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2 mb-6">
                      <TabsTrigger value="upload" className="gap-2">
                        <UploadIcon className="h-4 w-4" /> Upload
                      </TabsTrigger>
                      <TabsTrigger value="record" className="gap-2">
                        <Mic className="h-4 w-4" /> Record
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload">
                      <AudioUploadZone
                        onFileSelected={processAudio}
                        isProcessing={step !== "idle" && step !== "done" && step !== "error"}
                      />
                    </TabsContent>
                    <TabsContent value="record">
                      <LiveRecorder
                        onTranscriptComplete={processRecordedText}
                        disabled={step !== "idle" && step !== "done" && step !== "error"}
                      />
                    </TabsContent>
                  </Tabs>
                </section>
              </>
            )}

            {step !== "idle" && step !== "done" && (
              <section className="mb-8">
                <ProcessingStatus currentStep={step} errorMessage={errorMessage} />
              </section>
            )}

            {showResults && (
              <section className="space-y-6">
                <ResultsPane
                  transcription={transcription}
                  translation={translation}
                  isEnglish={isEnglish}
                  detectedLanguage={detectedLanguage}
                />
                <AnalysisPane analysis={analysis} loading={analyzing} />
              </section>
            )}

            {showResults && activeHistoryId && (
              <AudioChat
                transcriptionId={activeHistoryId}
                transcription={transcription}
                translation={translation}
                analysis={analysis}
                fileName={fileName}
              />
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
