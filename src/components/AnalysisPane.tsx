import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ListChecks,
  Calendar,
  Gavel,
  Lightbulb,
  Quote,
  ArrowRight,
  Users,
  FileText,
  Loader2,
} from "lucide-react";

export interface ActionItem {
  task: string;
  assignee: string;
  deadline: string;
}
export interface DeadlineItem {
  when: string;
  what: string;
}
export interface SpeakerInsight {
  speaker: string;
  contribution: string;
}
export interface AudioAnalysis {
  summary: string;
  detailed_notes: string[];
  action_items: ActionItem[];
  deadlines: DeadlineItem[];
  key_decisions: string[];
  important_points: string[];
  highlights: string[];
  follow_ups: string[];
  speaker_analysis: SpeakerInsight[];
}

interface AnalysisPaneProps {
  analysis: AudioAnalysis | null;
  loading?: boolean;
}

function SectionCard({
  icon: Icon,
  title,
  children,
  empty,
}: {
  icon: typeof Sparkles;
  title: string;
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {empty ? <p className="text-muted-foreground italic">Nothing detected.</p> : children}
      </CardContent>
    </Card>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 list-disc pl-5">
      {items.map((it, i) => (
        <li key={i} className="leading-relaxed">{it}</li>
      ))}
    </ul>
  );
}

export function AnalysisPane({ analysis, loading }: AnalysisPaneProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating AI analysis…
        </CardContent>
      </Card>
    );
  }
  if (!analysis) return null;

  return (
    <div className="space-y-4">
      <Card className="border-primary/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{analysis.summary || "No summary available."}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard
          icon={FileText}
          title="Detailed Notes"
          empty={!analysis.detailed_notes?.length}
        >
          <BulletList items={analysis.detailed_notes} />
        </SectionCard>

        <SectionCard
          icon={ListChecks}
          title="Action Items"
          empty={!analysis.action_items?.length}
        >
          <ul className="space-y-3">
            {analysis.action_items.map((item, i) => (
              <li key={i} className="border-l-2 border-primary/40 pl-3">
                <p className="font-medium leading-snug">{item.task}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="h-3 w-3 mr-1" />
                    {item.assignee || "Unassigned"}
                  </Badge>
                  {item.deadline && (
                    <Badge variant="outline" className="text-xs">
                      <Calendar className="h-3 w-3 mr-1" />
                      {item.deadline}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={Calendar} title="Deadlines" empty={!analysis.deadlines?.length}>
          <ul className="space-y-2">
            {analysis.deadlines.map((d, i) => (
              <li key={i} className="flex gap-2">
                <Badge variant="outline" className="shrink-0">{d.when}</Badge>
                <span>{d.what}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard icon={Gavel} title="Key Decisions" empty={!analysis.key_decisions?.length}>
          <BulletList items={analysis.key_decisions} />
        </SectionCard>

        <SectionCard
          icon={Lightbulb}
          title="Important Discussion Points"
          empty={!analysis.important_points?.length}
        >
          <BulletList items={analysis.important_points} />
        </SectionCard>

        <SectionCard icon={Quote} title="Highlights" empty={!analysis.highlights?.length}>
          <ul className="space-y-2">
            {analysis.highlights.map((h, i) => (
              <li
                key={i}
                className="border-l-2 border-primary/60 pl-3 italic text-muted-foreground"
              >
                "{h}"
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          icon={ArrowRight}
          title="Follow-up Recommendations"
          empty={!analysis.follow_ups?.length}
        >
          <BulletList items={analysis.follow_ups} />
        </SectionCard>

        <SectionCard
          icon={Users}
          title="Speaker Analysis"
          empty={!analysis.speaker_analysis?.length}
        >
          <ul className="space-y-3">
            {analysis.speaker_analysis.map((s, i) => (
              <li key={i}>
                <p className="font-medium">{s.speaker}</p>
                <p className="text-muted-foreground leading-relaxed">{s.contribution}</p>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
