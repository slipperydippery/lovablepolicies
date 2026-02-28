import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Static context data (matches the frontend mock data)
const SUPPLIERS = [
  { name: "ABENA Healthcare BV", category: "Medical supplies", approved: true },
  { name: "Lyreco Nederland bv", category: "Office supplies", approved: true },
  { name: "Mediq Nederland BV", category: "Medical supplies", approved: true },
  { name: "Technische Unie BV", category: "Technical materials", approved: true },
];

const LEDGER = [
  { code: "1", name: "FOOD, BEVERAGES & KITCHEN", subLedgers: [
    { code: 4110, name: "Nutrition", budget: 900000, spent: 680000 },
    { code: 4120, name: "Meals provided by third parties", budget: 550000, spent: 420000 },
    { code: 4130, name: "Beverages & Snacks", budget: 350000, spent: 210000 },
  ]},
  { code: "3", name: "CARE & TREATMENT", subLedgers: [
    { code: 4310, name: "Incontinence Materials", budget: 1200000, spent: 1100000 },
    { code: 4330, name: "Medical Aids", budget: 800000, spent: 750000 },
    { code: 4340, name: "Recreation (Activities & Wellbeing)", budget: 500000, spent: 625000 },
  ]},
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, locationName, language } = await req.json();
    const responseLang = language === "nl" ? "Dutch" : "English";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch policies from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: policies } = await supabase
      .from("policies")
      .select("id, name, status, category, limit_amount, max_amount, allowed_categories, ledger, friction, intent")
      .eq("status", "active");

    const policyContext = (policies || [])
      .map((p: any) => `- ${p.id}: "${p.name}" (category: ${p.category || "general"}, max: ${p.max_amount || p.limit_amount || "no limit"}, friction: ${p.friction || "normal"}${p.intent ? `, intent: ${p.intent}` : ""}${p.allowed_categories ? `, allowed: ${p.allowed_categories}` : ""})`)
      .join("\n");

    const supplierContext = SUPPLIERS
      .map((s) => `- ${s.name} (${s.category}) — ${s.approved ? "approved" : "not approved"}`)
      .join("\n");

    const ledgerContext = LEDGER
      .flatMap((cat) =>
        cat.subLedgers.map((sl) => {
          const remaining = sl.budget - sl.spent;
          return `- Code ${sl.code}: ${sl.name} — Budget: €${(sl.budget / 100).toLocaleString()}, Remaining: €${(remaining / 100).toLocaleString()}`;
        })
      )
      .join("\n");

    const systemPrompt = `You are a friendly procurement assistant for a Dutch healthcare organization. The user is a care worker at location "${locationName || "De VeldKeur"}".

Your role:
1. Help the user decide if a purchase is allowed based on active policies.
2. Be **simple, friendly, and supportive** — use short sentences, no jargon.
3. **Never mention ledger codes or numbers** (no "4340", "Code 4310", etc.). Just say whether the budget is available.
4. Check if the supplier is on the approved list.
5. Use **bold** for emphasis.

ACTIVE POLICIES:
${policyContext || "No active policies found in the database."}

APPROVED SUPPLIERS:
${supplierContext}

BUDGET LEDGERS (for your internal reference only — never show codes to the user):
${ledgerContext}

IMPORTANT RULES:
- Keep responses to **1-2 short sentences**. Get straight to the point. Be warm but brief.
- When you approve a purchase, end your message with a marker on its own line: [REGISTER:amount] where amount is the euro value (e.g. [REGISTER:15.00])
- This marker triggers a "Register Purchase" button in the UI. Only include it when you're giving approval.
- At the very end of your response, add a marker listing every policy ID you referenced: [POLICIES:POL-ID-1,POL-ID-2] (e.g. [POLICIES:POL-2026-041,POL-2026-042]). If no policies were referenced, omit this marker entirely.
- Do NOT mention policy IDs in the text itself — only put them in the [POLICIES:...] marker.
- If a supplier is not on the approved list, note that but consider if an exception policy applies.
- If no active policy clearly covers the requested purchase, do NOT approve it. Instead, advise the user to check with their financial administrator before proceeding. Do NOT include the [REGISTER:...] marker in this case.
- Always respond in **${responseLang}**.

CROSS-LANGUAGE MATCHING:
- Policies are stored in English. The user may ask questions in any language.
- You MUST match policies semantically regardless of language. For example, a Dutch question about "luiers" should match "Incontinence Material" policies.
- Always reason about the intent behind the question, not literal keyword matching.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please top up in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("policy-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
