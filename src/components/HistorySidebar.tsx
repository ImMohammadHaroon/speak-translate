import { FileAudio, Trash2, Clock, Plus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

interface TranscriptionRecord {
  id: string;
  file_name: string;
  detected_language: string | null;
  transcription: string;
  translation: string | null;
  is_english: boolean;
  created_at: string;
}

interface HistorySidebarProps {
  records: TranscriptionRecord[];
  onSelect: (record: TranscriptionRecord) => void;
  onDelete: (id: string) => void;
  onNewTranscription: () => void;
  activeId?: string;
}

export function HistorySidebar({ records, onSelect, onDelete, onNewTranscription, activeId }: HistorySidebarProps) {
  return (
    <Sidebar className="border-r border-border">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <img src="/owl-favicon.png" alt="Devowl" className="h-8 w-8" />
          <span className="font-semibold text-sm text-foreground">Devowl</span>
        </div>
        <Button onClick={onNewTranscription} className="w-full" size="sm">
          <Plus className="h-4 w-4" />
          New Transcription
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            History
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <SidebarMenu>
                {records.length === 0 && (
                  <p className="px-3 py-6 text-xs text-muted-foreground text-center">
                    No transcriptions yet
                  </p>
                )}
                {records.map((record) => (
                  <SidebarMenuItem key={record.id}>
                    <SidebarMenuButton
                      onClick={() => onSelect(record)}
                      className={`group w-full justify-between py-2.5 ${activeId === record.id ? "bg-accent" : ""}`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileAudio className="h-4 w-4 shrink-0 text-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm">{record.file_name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {record.detected_language} · {new Date(record.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
