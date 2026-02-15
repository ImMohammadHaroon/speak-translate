import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, FileAudio, Clock } from "lucide-react";

interface TranscriptionRecord {
  id: string;
  file_name: string;
  detected_language: string | null;
  transcription: string;
  translation: string | null;
  is_english: boolean;
  created_at: string;
}

interface TranscriptionHistoryProps {
  records: TranscriptionRecord[];
  onSelect: (record: TranscriptionRecord) => void;
  onDelete: (id: string) => void;
}

export function TranscriptionHistory({ records, onSelect, onDelete }: TranscriptionHistoryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4" />
          History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[300px]">
          <div className="space-y-2">
            {records.map((record) => (
              <div
                key={record.id}
                onClick={() => onSelect(record)}
                className="flex items-center justify-between gap-3 rounded-md border border-border p-3 cursor-pointer transition-colors hover:bg-accent/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileAudio className="h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{record.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.detected_language} · {new Date(record.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-8 w-8"
                  onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
