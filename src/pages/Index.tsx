import { useState, useCallback } from "react";
import { AudioUploadZone } from "@/components/AudioUploadZone";
import { ProcessingStatus, type ProcessingStep } from "@/components/ProcessingStatus";
import { ResultsPane } from "@/components/ResultsPane";
import { fileToBase64 } from "@/lib/audio-utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Languages, Headphones } from "lucide-react";

const Index = () => {
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [translation, setTranslation] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [isEnglish, setIsEnglish] = useState(false);
  const { toast } = useToast();

  const processAudio = useCallback(async (file: File) => {
    setStep("uploading");
    setErrorMessage("");
    setTranscription("");
    setTranslation("");
    setDetectedLanguage("");
    setIsEnglish(false);

    try {
      // Step 1: Convert to base64
      const audioBase64 = await fileToBase64(file);

      // Step 2: Transcribe
      setStep("transcribing");
      const { data: transcribeData, error: transcribeError } = await supabase.functions.invoke(
        "transcribe",
        { body: { audioBase64, mimeType: file.type, fileName: file.name } }
      );

      if (transcribeError) throw new Error(transcribeError.message || "Transcription failed");
      if (transcribeData?.error) throw new Error(transcribeData.error);

      let rawTranscription = transcribeData.transcription || "";

      // Extract detected language from the [Language: ...] tag
      let lang = "Unknown";
      const langMatch = rawTranscription.match(/\[Language:\s*(.+?)\]/i);
      if (langMatch) {
        lang = langMatch[1].trim();
        rawTranscription = rawTranscription.replace(/\[Language:\s*.+?\]\s*/i, "").trim();
      }
      setDetectedLanguage(lang);
      setTranscription(rawTranscription);

      // Step 3: Translate
      setStep("translating");
      const { data: translateData, error: translateError } = await supabase.functions.invoke(
        "translate",
        { body: { text: rawTranscription, detectedLanguage: lang } }
      );

      if (translateError) throw new Error(translateError.message || "Translation failed");
      if (translateData?.error) throw new Error(translateData.error);

      setTranslation(translateData.translation || "");
      setIsEnglish(lang.toLowerCase().includes("english") || !!translateData.isEnglish);

      setStep("done");
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
  }, [toast]);

  const showResults = step === "done" && transcription;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-20">
        {/* Hero */}
        <header className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Headphones className="h-8 w-8 text-primary" />
            <Languages className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Audio Transcription & Translation
          </h1>
          <p className="mt-3 text-muted-foreground">
            Upload any audio file — get an accurate transcription and English translation in seconds.
          </p>
        </header>

        {/* Upload Zone */}
        <section className="mb-8">
          <AudioUploadZone
            onFileSelected={processAudio}
            isProcessing={step !== "idle" && step !== "done" && step !== "error"}
          />
        </section>

        {/* Processing Status */}
        {step !== "idle" && (
          <section className="mb-8">
            <ProcessingStatus currentStep={step} errorMessage={errorMessage} />
          </section>
        )}

        {/* Results */}
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
  );
};

export default Index;
