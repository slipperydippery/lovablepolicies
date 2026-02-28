import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Also try loading .env from current dir (for Railway root dir = server/)
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors({
  origin: [
    "https://lovablepolicies.vercel.app",
    "http://localhost:8080",
    "http://localhost:8081",
  ],
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const PORT = process.env.PORT || 3001;

// ── Health check ────────────────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ── Anthropic client ────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ── Chat endpoint ───────────────────────────────────────────────────

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { messages, locationName, language } = req.body as {
      messages: { role: string; content: string }[];
      locationName: string;
      language?: string;
    };
    const responseLang = language === "nl" ? "Dutch" : "English";

    // Fetch active policies from Supabase
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

// ── Extract policies endpoint ───────────────────────────────────────

app.post("/api/extract-policies", upload.array("files", 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    // Extract text from each file
    const documents: { name: string; content: string }[] = [];
    for (const file of files) {
      let text: string;
      if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
        const pdfParser = new PDFParse({ data: new Uint8Array(file.buffer) });
        const parsed = await pdfParser.getText();
        text = parsed.text;
      } else {
        text = file.buffer.toString("utf-8");
      }
      documents.push({ name: file.originalname, content: text });
    }

    const documentsContext = documents
      .map((d) => `=== DOCUMENT: "${d.name}" ===\n${d.content}\n=== END OF "${d.name}" ===`)
      .join("\n\n");

    const systemPrompt = `You are a policy extraction engine for a Dutch healthcare procurement system.

Your task: Read the uploaded policy documents and extract every atomic purchasing rule into structured JSON.

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no explanation:
{
  "readyPolicies": [
    {
      "id": "POL-2026-XXX",
      "name": "Short English policy name",
      "category": "Category name",
      "maxAmount": "EUR XX,XX per unit (human-readable)",
      "friction": "Low" | "Medium" | "High",
      "afasCode": 4XXX,
      "intent": "One-sentence description of what this policy allows or restricts.",
      "limitAmount": 50,
      "benchmarkScore": "Matches VVT Standard" or similar,
      "benchmarkWarning": false,
      "startDate": "2026-01-01",
      "endDate": "2026-12-31"
    }
  ],
  "conflictPolicies": [
    {
      "id": "POL-2026-XXX",
      "name": "Short English policy name",
      "category": "Category name",
      "friction": "Low" | "Medium" | "High",
      "afasCode": 4XXX,
      "intent": "One-sentence description.",
      "conflictField": "Human-readable field name (e.g. Max spend per birthday)",
      "sourceA": { "label": "Document name A", "value": 15, "display": "EUR 15" },
      "sourceB": { "label": "Document name B", "value": 25, "display": "EUR 25" },
      "benchmark": { "label": "Sector avg", "value": 20, "display": "EUR 20" }
    }
  ]
}

RULES:
1. Extract every distinct purchasing rule as a separate policy.
2. If TWO OR MORE documents specify DIFFERENT values for the same rule (e.g. different spending limits), put it in "conflictPolicies" with sourceA/sourceB referencing the document names and their respective values. Provide a reasonable benchmark suggestion.
3. If a rule appears in multiple documents with CONSISTENT values, or only in one document, put it in "readyPolicies".
4. Generate unique policy IDs in format POL-2026-XXX (increment from 041).
5. Map each policy to a plausible AFAS ledger code:
   - 4110 = Nutrition, 4120 = Meals by third parties, 4130 = Beverages & Snacks
   - 4210 = Groceries, 4230 = Office Supplies
   - 4310 = Incontinence Materials, 4320 = Pharmaceuticals, 4330 = Medical Aids, 4340 = Recreation
   - 4510 = Travel & Transport, 4600 = Temporary Staff
6. Friction levels: Low = under EUR 50 / auto-approve, Medium = EUR 50-150 / needs awareness, High = above EUR 150 or requires approval.
7. Policy names and all fields MUST be in English.
8. limitAmount should be the numeric euro value (integer). Use 0 if no per-transaction limit.
9. Dates: use reasonable defaults (startDate = 2026-01-01, endDate = 2026-12-31) unless the document specifies dates.
10. Return ONLY the JSON object. No markdown, no commentary.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: documentsContext }],
    });

    // Extract text from response
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return res.status(500).json({ error: "No text response from AI" });
    }

    // Parse JSON — strip markdown fences if Claude adds them despite instructions
    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);

    // Validate basic shape
    if (!Array.isArray(parsed.readyPolicies) || !Array.isArray(parsed.conflictPolicies)) {
      return res.status(500).json({ error: "AI returned invalid policy structure" });
    }

    res.json(parsed);
  } catch (e: any) {
    console.error("extract-policies error:", e);
    res.status(500).json({ error: e.message || "Unknown error" });
  }
});

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
});
