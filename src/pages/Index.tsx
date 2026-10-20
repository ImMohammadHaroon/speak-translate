import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { AudioUploadZone } from "@/components/AudioUploadZone";
import { LiveRecorder } from "@/components/LiveRecorder";
import { ProcessingStatus, type ProcessingStep } from "@/components/ProcessingStatus";
import { ResultsPane } from "@/components/ResultsPane";
import { AnalysisPane, type AudioAnalysis } from "@/components/AnalysisPane";
import { AudioChat } from "@/components/AudioChat";
import { fileToBase64, resolveAudioMimeType } from "@/lib/audio-utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, Mic } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { toast } = useToast();

  const runAnalysis = useCallback(
    async (textForAnalysis: string) => {
      setAnalyzing(true);
      try {
        const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
          "analyze",
          { body: { text: textForAnalysis } },
        );
        if (analyzeError) throw new Error(analyzeError.message || "Analysis failed");
        if (analyzeData?.error) throw new Error(analyzeData.error);
        setAnalysis((analyzeData?.analysis as AudioAnalysis) ?? null);
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
    },
    [toast],
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

    try {
      const audioBase64 = await fileToBase64(file);

      setStep("transcribing");
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        "transcribe",
        { body: { audioBase64, mimeType: resolveAudioMimeType(file), fileName: file.name } }
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

      await runAnalysis(sourceIsEnglish ? translationText || rawTranscription : translationText);
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
  }, [toast, runAnalysis]);

  const processRecordedText = useCallback(
    async ({ text, fileName: recName }: { text: string; fileName: string }) => {
      setStep("translating");
      setErrorMessage("");
      setFileName(recName);
      setAnalysis(null);
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

        await runAnalysis(translationText || text);
      } catch (err: unknown) {
        console.error("Recorded text processing error:", err);
        setStep("error");
        const message = err instanceof Error ? err.message : "An unexpected error occurred";
        setErrorMessage(message);
        toast({ title: "Processing Failed", description: message, variant: "destructive" });
      }
    },
    [toast, runAnalysis],
  );

  const handleNewTranscription = useCallback(() => {
    setStep("idle");
    setTranscription("");
    setTranslation("");
    setDetectedLanguage("");
    setIsEnglish(false);
    setFileName("");
    setAnalysis(null);
    setAnalyzing(false);
    setErrorMessage("");
  }, []);

  const showResults = step === "done" && transcription;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          Devowl
        </Link>
        <div className="flex items-center gap-2">
          {showResults && (
            <Button variant="ghost" size="sm" onClick={handleNewTranscription}>
              New transcription
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
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
                <TabsList className="mx-auto mb-6 grid w-full max-w-sm grid-cols-2">
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

        {showResults && (
          <AudioChat
            transcription={transcription}
            translation={translation}
            analysis={analysis}
            fileName={fileName}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
