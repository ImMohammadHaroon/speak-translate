import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert meeting/audio analyst. You will be given an English transcript of an audio recording.
Analyze it carefully and call the "return_analysis" function with structured insights.

Guidelines:
- Be concrete and specific. Quote short phrases from the transcript when helpful.
- If a section has no relevant content, return an empty array (or empty string for the summary).
- Assignees: extract a person's name only if it's clearly identifiable in the transcript; otherwise use "Unassigned".
- Deadlines: only include explicit time references ("by Friday", "next week", "Aug 12", "EOD"). Don't invent dates.
- Speakers: only fill speaker_analysis if the transcript clearly contains multiple speakers (e.g. labelled turns or strong contextual cues). Otherwise return [].`;

const tools = [
  {
    type: "function",
    function: {
      name: "return_analysis",
      description: "Return a structured analysis of the audio transcript.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          summary: { type: "string", description: "A 2-4 sentence high-level summary of what the audio is about." },
          detailed_notes: {
            type: "array",
            description: "Detailed bullet-point notes covering the full content, organized logically.",
            items: { type: "string" },
          },
          action_items: {
            type: "array",
            description: "Concrete tasks that need to be done.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                task: { type: "string" },
                assignee: { type: "string" },
                deadline: { type: "string", description: "Deadline if mentioned, else empty string." },
              },
              required: ["task", "assignee", "deadline"],
            },
          },
          deadlines: {
            type: "array",
            description: "All explicit deadlines or dates mentioned with what they refer to.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                when: { type: "string" },
                what: { type: "string" },
              },
              required: ["when", "what"],
            },
          },
          key_decisions: {
            type: "array",
            description: "Decisions made or agreed upon during the audio.",
            items: { type: "string" },
          },
          important_points: {
            type: "array",
            description: "Important discussion points worth remembering.",
            items: { type: "string" },
          },
          highlights: {
            type: "array",
            description: "Standout quotes or moments from the audio.",
            items: { type: "string" },
          },
          follow_ups: {
            type: "array",
            description: "Recommended follow-up actions or next steps for after the meeting.",
            items: { type: "string" },
          },
          speaker_analysis: {
            type: "array",
            description: "Per-speaker breakdown. Empty array if speakers cannot be distinguished.",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                speaker: { type: "string" },
                contribution: { type: "string", description: "What this speaker contributed/said overall." },
              },
              required: ["speaker", "contribution"],
            },
          },
        },
        required: [
          "summary",
          "detailed_notes",
          "action_items",
          "deadlines",
          "key_decisions",
          "important_points",
          "highlights",
          "follow_ups",
          "speaker_analysis",
        ],
      },
    },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Transcript (English):\n\n${text}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "Analysis failed." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call returned:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "Model did not return structured analysis." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let analysis: unknown;
    try {
      analysis = JSON.parse(argsStr);
    } catch (e) {
      console.error("Failed to parse tool args:", e, argsStr);
      return new Response(JSON.stringify({ error: "Failed to parse analysis." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analyze error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
