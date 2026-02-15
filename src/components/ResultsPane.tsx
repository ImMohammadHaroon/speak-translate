import { Copy, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useCallback } from "react";

interface ResultsPaneProps {
  transcription: string;
  translation: string;
  isEnglish: boolean;
  detectedLanguage: string;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      <span className="hidden sm:inline">{copied ? "Copied" : label}</span>
    </Button>
  );
}

export function ResultsPane({ transcription, translation, isEnglish, detectedLanguage }: ResultsPaneProps) {
  const handleDownload = useCallback(() => {
    const content = `=== Original Transcription ===\nDetected Language: ${detectedLanguage}\n\n${transcription}\n\n=== English Translation ===\n\n${isEnglish ? "(Source is already in English — cleaned version above)" : translation}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transcription.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [transcription, translation, isEnglish, detectedLanguage]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Download .txt</span>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">
              Original Transcription
              {detectedLanguage && (
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({detectedLanguage})
                </span>
              )}
            </CardTitle>
            <CopyButton text={transcription} label="Copy" />
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] sm:h-[400px]">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {transcription}
              </p>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">English Translation</CardTitle>
            {!isEnglish && <CopyButton text={translation} label="Copy" />}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] sm:h-[400px]">
              {isEnglish ? (
                <p className="text-sm text-muted-foreground italic">
                  The source audio is already in English. The original transcription above has been
                  cleaned for grammar and formatting.
                </p>
              ) : (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {translation}
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
