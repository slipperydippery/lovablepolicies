import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
import express, { Request, Response } from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ── Static context (matches the edge function) ──────────────────────

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

// ── Supabase client ─────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Anthropic client ────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Chat endpoint ───────────────────────────────────────────────────

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages, locationName } = req.body as {
      messages: { role: string; content: string }[];
      locationName: string;
    };

    // Fetch active policies from Supabase
    const { data: policies } = await supabase
      .from("policies")
      .select("id, name, status, category, limit_amount, max_amount, allowed_categories, ledger, friction, intent")
      .eq("status", "active");

    const policyContext = (policies || [])
      .map((p: any) => `- ${p.id}: "${p.name}" (category: ${p.category || "general"}, max: ${p.max_amount || p.limit_amount || "no limit"}, ledger: ${p.ledger || "unspecified"}, friction: ${p.friction || "normal"})`)
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
- Always respond in English.`;

    // Convert messages: separate system from user/assistant
    const anthropicMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Stream from Anthropic
    const stream = anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
    });

    stream.on("text", (text: string) => {
      // Emit in OpenAI-compatible SSE format so the frontend parser works unchanged
      const chunk = JSON.stringify({
        choices: [{ delta: { content: text } }],
      });
      res.write(`data: ${chunk}\n\n`);
    });

    stream.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });

    stream.on("error", (err: Error) => {
      console.error("Anthropic stream error:", err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    // Handle client disconnect
    req.on("close", () => {
      stream.abort();
    });
  } catch (e: any) {
    console.error("chat error:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
