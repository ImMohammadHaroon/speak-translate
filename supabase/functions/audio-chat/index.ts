import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages, transcription, translation, analysis, fileName } = await req.json() as {
      messages: ChatMessage[];
      transcription: string;
      translation?: string;
      analysis?: unknown;
      fileName?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an AI assistant helping the user understand and discuss an audio recording${fileName ? ` titled "${fileName}"` : ""}.

You have access to:
1. The full transcript of the audio (original language and English translation).
2. Prior AI analysis (summary, action items, decisions, etc.).
3. Your own general knowledge of the world, current events, concepts, people, and topics — use it to enrich answers with relevant external context when helpful.

When answering:
- ALWAYS ground answers in the audio content first. Quote or reference specific parts of the transcript when relevant.
- If the user asks about something not in the audio, draw on your general knowledge and clearly mark it as "Outside the audio:" or "Additional context:".
- Be concise, accurate, and helpful. Use markdown formatting (bullets, bold) when it improves clarity.
- If you don't know or can't find the answer in the transcript, say so honestly.

=== AUDIO TRANSCRIPT (Original) ===
${transcription || "(empty)"}

${translation ? `=== AUDIO TRANSCRIPT (English Translation) ===\n${translation}\n` : ""}
${analysis ? `=== PRIOR AI ANALYSIS ===\n${JSON.stringify(analysis, null, 2)}\n` : ""}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("audio-chat error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
