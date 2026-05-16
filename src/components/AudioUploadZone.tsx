import { useCallback, useState } from "react";
import { Upload, FileAudio, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateAudioFile, formatFileSize } from "@/lib/audio-utils";
import { useToast } from "@/hooks/use-toast";

interface AudioUploadZoneProps {
  onFileSelected: (file: File) => void;
  isProcessing: boolean;
}

export function AudioUploadZone({ onFileSelected, isProcessing }: AudioUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(
    (file: File) => {
      const error = validateAudioFile(file);
      if (error) {
        toast({ title: "Invalid File", description: error, variant: "destructive" });
        return;
      }
      setSelectedFile(file);
      onFileSelected(file);
    },
    [onFileSelected, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (isProcessing) return;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".mp3,.wav,.m4a,.ogg,.flac,.webm";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile, isProcessing]);

  const clearFile = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!isProcessing) setSelectedFile(null);
    },
    [isProcessing]
  );

  return (
    <div
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        "relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 transition-all cursor-pointer",
        isDragging
          ? "border-primary bg-accent scale-[1.01]"
          : "border-border hover:border-primary/50 hover:bg-accent/50",
        isProcessing && "pointer-events-none opacity-60"
      )}
    >
      {selectedFile ? (
        <div className="flex items-center gap-3">
          <FileAudio className="h-8 w-8 text-primary" />
          <div>
            <p className="font-medium text-foreground">{selectedFile.name}</p>
            <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          </div>
          {!isProcessing && (
            <button onClick={clearFile} className="ml-2 rounded-full p-1 hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="rounded-full bg-accent p-4">
            <Upload className="h-8 w-8 text-accent-foreground" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">
              Drop your audio file here, or <span className="text-primary underline">browse</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              MP3, WAV, M4A, OGG, FLAC — up to 25MB
            </p>
          </div>
        </>
      )}
    </div>
  );
}
