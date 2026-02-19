import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    // Handle transcription request (multipart form with audio)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const audioFile = formData.get("audio") as File;
      if (!audioFile) throw new Error("No audio file provided");

      // Transcribe with Whisper
      const whisperForm = new FormData();
      whisperForm.append("file", audioFile, "recording.webm");
      whisperForm.append("model", "whisper-1");
      whisperForm.append("response_format", "verbose_json");

      const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: whisperForm,
      });

      if (!whisperRes.ok) {
        const err = await whisperRes.text();
        console.error("Whisper error:", err);
        throw new Error("Transcription failed");
      }

      const result = await whisperRes.json();
      return new Response(JSON.stringify({
        text: result.text,
        duration: result.duration || 0,
        language: result.language,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Handle contact extraction request (JSON body)
    const { action, transcription, contactNames } = await req.json();

    if (action === "extract-contact") {
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const prompt = `You are analyzing a voice note transcription from a loan officer.
Extract any contact/person mentioned.
Transcription: "${transcription}"
Known contacts: ${contactNames || "none"}
Instructions:
1. Identify if any person/company is mentioned
2. Match to known contacts if possible (fuzzy match OK)
3. Infer contact type (realtor, financial_planner, cpa, attorney, wealth_manager, past_client, other)
4. Provide confidence score (0-100)

Respond in JSON format only:
{"contactName": "extracted name or null", "contactType": "inferred type or null", "confidence": 0, "rawMentions": []}`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-lite",
          messages: [
            { role: "system", content: "You are a contact extraction assistant. Always respond with valid JSON only, no markdown." },
            { role: "user", content: prompt },
          ],
          temperature: 0.3,
        }),
      });

      if (!aiRes.ok) {
        const err = await aiRes.text();
        console.error("AI gateway error:", err);
        return new Response(JSON.stringify({ contactName: null, confidence: 0, rawMentions: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResult = await aiRes.json();
      const content = aiResult.choices?.[0]?.message?.content || "{}";
      
      // Parse JSON from response, handling potential markdown wrapping
      let extraction;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        extraction = JSON.parse(jsonMatch ? jsonMatch[0] : content);
      } catch {
        extraction = { contactName: null, confidence: 0, rawMentions: [] };
      }

      return new Response(JSON.stringify(extraction), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (e) {
    console.error("voice-transcribe error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
