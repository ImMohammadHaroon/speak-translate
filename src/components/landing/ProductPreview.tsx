import { useCallback, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const original = `La fecha límite se mueve al jueves. Por favor envíen las notas esta noche, y confirmen quién habla con el cliente.`;

const english = `The deadline moves to Thursday. Please send the notes tonight, and confirm who will speak with the client.`;

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button variant="outline" size="sm" type="button" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? "Copied" : label}
    </Button>
  );
}

export function ProductPreview() {
  return (
    <section id="output" className="scroll-mt-16 border-t border-border bg-muted/40 px-4 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="max-w-[16ch] font-serif text-3xl font-medium leading-[1.15] tracking-tight md:text-5xl">
          A transcript beside its translation.
        </h2>
        <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
          This is the same two-pane layout you use in the app, shown here with a short sample clip.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">
                Original Transcription
                <span className="ml-2 text-xs font-normal text-muted-foreground">(Spanish)</span>
              </CardTitle>
              <CopyButton text={original} label="Copy" />
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{original}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">English Translation</CardTitle>
              <CopyButton text={english} label="Copy" />
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">{english}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
