import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
// Also try loading .env from current dir (for Railway root dir = server/)
dotenv.config();
import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import Anthropic from "@anthropic-ai/sdk";
import db from "./db.js";
import {
  SqlitePolicyRepository,
  SqliteDocumentJobRepository,
  SqlitePolicyConflictRepository,
  SqliteAuditLogRepository,
} from "./repo-sqlite.js";
import type { IPolicyRepository, IDocumentJobRepository, IPolicyConflictRepository, IAuditLogRepository } from "./repo.js";

const policyRepo: IPolicyRepository = new SqlitePolicyRepository(db);
const jobRepo: IDocumentJobRepository = new SqliteDocumentJobRepository(db);
const conflictRepo: IPolicyConflictRepository = new SqlitePolicyConflictRepository(db);
const auditRepo: IAuditLogRepository = new SqliteAuditLogRepository(db);

const app = express();
app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (e.g. curl, mobile apps)
    if (!origin) return callback(null, true);
    // Allow all localhost / 127.0.0.1 ports for local development
    if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) return callback(null, true);
    // Production frontend + Vercel preview deployments
    if (origin.match(/^https:\/\/.*\.vercel\.app$/) || origin === "https://lovablepolicies.vercel.app") return callback(null, true);
    console.warn("CORS blocked origin:", origin);
    callback(new Error("Not allowed by CORS"));
  },
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

// ── Anthropic client ────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Prevent unhandled rejections from crashing the process (e.g. stream abort)
process.on("unhandledRejection", (err: any) => {
  if (err?.name === "APIUserAbortError") return; // client disconnected — safe to ignore
  console.error("Unhandled rejection:", err);
});

// ── Chat endpoint ───────────────────────────────────────────────────

app.post("/api/chat", async (req: Request, res: Response) => {
  console.log("[chat] Received chat request");
  try {
    const { messages, locationName, language } = req.body as {
      messages: { role: string; content: string }[];
      locationName: string;
      language?: string;
    };
    const responseLang = language === "nl" ? "Dutch" : "English";

    // Fetch active policies from SQLite
    const policies = policyRepo.getActive();

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
- Policies are stored in their source language (usually Dutch).
- The user may ask questions in any language. You MUST match policies semantically regardless of language.
- For example, an English question about "diapers" should match a Dutch "Incontinentiemateriaal" policy, and vice versa.
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

    // Use the low-level streaming API for maximum compatibility
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: anthropicMessages,
      stream: true,
    });

    // Handle client disconnect
    let aborted = false;
    req.on("close", () => {
      aborted = true;
      try { response.controller.abort(); } catch { /* safe to ignore */ }
    });

    try {
      for await (const event of response) {
        if (aborted) break;
        if (event.type === "content_block_delta" && (event.delta as any).type === "text_delta") {
          const chunk = JSON.stringify({
            choices: [{ delta: { content: (event.delta as any).text } }],
          });
          res.write(`data: ${chunk}\n\n`);
        }
      }
    } catch (streamErr: any) {
      if (!aborted) {
        console.error("Anthropic stream error:", streamErr);
        res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
      }
    }

    if (!aborted) {
      res.write("data: [DONE]\n\n");
      res.end();
    }
  } catch (e: any) {
    console.error("chat error:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || "Unknown error" });
    }
  }
});

// ── Policy REST API ─────────────────────────────────────────────────

app.get("/api/policies", (_req: Request, res: Response) => {
  try {
    const policies = policyRepo.getAll();
    res.json(policies);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/policies/:id", (req: Request, res: Response) => {
  try {
    const policy = policyRepo.getById(req.params.id as string);
    if (!policy) return res.status(404).json({ error: "Policy not found" });
    res.json(policy);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/policies/:id", (req: Request, res: Response) => {
  try {
    const { changes } = req.body as { changes: Record<string, unknown> };
    policyRepo.update(req.params.id as string, changes);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/policies/upsert", (req: Request, res: Response) => {
  try {
    const { rows } = req.body as { rows: any[] };
    const count = policyRepo.upsert(rows);
    res.json({ count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/policies", (_req: Request, res: Response) => {
  try {
    const count = policyRepo.deleteAll();
    res.json({ count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/policies/benchmarks", (req: Request, res: Response) => {
  try {
    const { updates } = req.body as {
      updates: { id: string; benchmark_score: string | null; benchmark_warning: boolean }[];
    };
    const count = policyRepo.updateBenchmarks(updates);
    res.json({ count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Document Jobs endpoints ──────────────────────────────────────────

app.post("/api/document-jobs", upload.array("files", 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const jobs: { id: string; filename: string }[] = [];
    for (const file of files) {
      let text: string;
      if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
        const pdfParser = new PDFParse({ data: new Uint8Array(file.buffer) });
        const parsed = await pdfParser.getText();
        text = parsed.text;
      } else {
        text = file.buffer.toString("utf-8");
      }

      const jobId = `job-${crypto.randomUUID()}`;
      jobRepo.create({ id: jobId, filename: file.originalname, file_content: text });
      jobs.push({ id: jobId, filename: file.originalname });
    }

    // Kick off background processing
    scheduleProcessing();

    res.json({ jobs });
  } catch (e: any) {
    console.error("document-jobs create error:", e);
    res.status(500).json({ error: e.message || "Unknown error" });
  }
});

app.get("/api/document-jobs", (_req: Request, res: Response) => {
  try {
    const jobs = jobRepo.getAll();
    res.json(jobs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/document-jobs/:id/cancel", (req: Request, res: Response) => {
  try {
    jobRepo.cancel(req.params.id as string);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/document-jobs", (_req: Request, res: Response) => {
  try {
    const count = jobRepo.deleteAll();
    res.json({ count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Policy Conflicts endpoints ───────────────────────────────────────

app.get("/api/policy-conflicts", (_req: Request, res: Response) => {
  try {
    const conflicts = conflictRepo.getAll();
    res.json(conflicts);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/policy-conflicts/:id/resolve", (req: Request, res: Response) => {
  try {
    const { resolved_policy_id } = req.body as { resolved_policy_id: string };
    conflictRepo.resolve(req.params.id as string, resolved_policy_id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/policy-conflicts/:id/resolve-both", (req: Request, res: Response) => {
  try {
    const conflicts = conflictRepo.getAll();
    const conflict = conflicts.find((c) => c.id === req.params.id);
    if (!conflict) return res.status(404).json({ error: "Conflict not found" });

    // Mark conflict as resolved (use policy_a as nominal winner)
    conflictRepo.resolve(conflict.id, conflict.policy_a_id);

    // Set both policies to active
    policyRepo.update(conflict.policy_a_id, { status: "active" });
    policyRepo.update(conflict.policy_b_id, { status: "active" });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/policy-conflicts", (_req: Request, res: Response) => {
  try {
    const count = conflictRepo.deleteAll();
    res.json({ count });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// ── Legacy extract-policies endpoint (used by demo mode) ─────────────

app.post("/api/extract-policies", upload.array("files", 20), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

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

    const systemPrompt = EXTRACTION_SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: "user", content: documentsContext }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return res.status(500).json({ error: "No text response from AI" });
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed.readyPolicies) || !Array.isArray(parsed.conflictPolicies)) {
      return res.status(500).json({ error: "AI returned invalid policy structure" });
    }

    res.json(parsed);
  } catch (e: any) {
    console.error("extract-policies error:", e);
    res.status(500).json({ error: e.message || "Unknown error" });
  }
});

// ── Shared extraction prompt ─────────────────────────────────────────

const EXTRACTION_SYSTEM_PROMPT = `You are a policy extraction engine for a Dutch healthcare procurement system.

Your task: Read the uploaded policy document and extract every atomic purchasing rule into structured JSON.

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no explanation:
{
  "policies": [
    {
      "name": "Short policy name (in the same language as the source document)",
      "category": "Category name",
      "maxAmount": "EUR XX,XX per unit (human-readable)",
      "friction": "Low" | "Medium" | "High",
      "afasCode": 4XXX,
      "intent": "2-3 sentence description of what this policy allows or restricts, including relevant conditions, thresholds, approval requirements, and context from the source document.",
      "limitAmount": 50,
      "startDate": "2026-01-01",
      "endDate": "2026-12-31",
      "tags": ["tag1", "tag2", "tag3"]
    }
  ]
}

RULES:
1. Extract every distinct purchasing rule as a separate policy.
2. Generate unique policy names that are clear and concise.
3. Map each policy to a plausible AFAS ledger code:
   - 4110 = Nutrition, 4120 = Meals by third parties, 4130 = Beverages & Snacks
   - 4210 = Groceries, 4230 = Office Supplies
   - 4310 = Incontinence Materials, 4320 = Pharmaceuticals, 4330 = Medical Aids, 4340 = Recreation
   - 4510 = Travel & Transport, 4600 = Temporary Staff
4. Friction levels: Low = under EUR 50 / auto-approve, Medium = EUR 50-150 / needs awareness, High = above EUR 150 or requires approval.
5. All output fields (name, category, intent, tags, maxAmount) MUST be in the SAME LANGUAGE as the source document. If the document is in Dutch, output everything in Dutch. If the document is in English, output everything in English.
6. limitAmount should be the numeric euro value (integer). Use 0 if no per-transaction limit.
7. Dates: use reasonable defaults (startDate = 2026-01-01, endDate = 2026-12-31) unless the document specifies dates.
8. The "intent" field MUST be 2-3 sentences. Include the specific conditions, who it applies to, what is allowed/restricted, and any approval or escalation requirements mentioned in the source document.
9. The "tags" field MUST contain 3-5 lowercase tags describing the specific subject matter and item type of the policy, in the same language as the source document. Each tag should be a SINGLE word or at most two hyphenated words. Do NOT create compound tags that merge multiple concepts (e.g. use "ergonomisch" NOT "ergonomisch-meubilair"). Tags should be specific enough to distinguish between different product types within the same category. Do NOT use generic tags like "inkoop" / "procurement" or "beleid" / "policy".
10. Use consistent, canonical tags for the same subject matter across policies. Policies about the same topic MUST share at least 2 identical tags. Use this canonical tag list:
   - Furniture/chairs/desks: "ergonomisch", "kantoormeubilair"
   - Office supplies: "kantoorartikelen", "lyreco"
   - Medical supplies: "medisch", "verbruiksartikelen"
   - Incontinence: "incontinentie", "abena"
   - Pharmacy: "farmacie", "medicatie"
   - Groceries: "boodschappen", "voeding"
   - Cleaning: "schoonmaak", "hygiene"
   - Recreation: "recreatie", "welzijn"
   - Travel: "reiskosten", "vervoer"
   - Temporary staff: "uitzendkrachten", "personeel"
   - Safety: "veiligheid", "brandpreventie"
   - Building maintenance: "onderhoud", "gebouw"
   - IT equipment: "it-apparatuur", "randapparatuur"
   Add 1-2 more specific tags per policy beyond the canonical ones. Do NOT use synonyms or paraphrases for the same concept — tag consistency is critical for cross-document conflict detection.
11. Return ONLY the JSON object. No markdown, no commentary.`;

// ── Background document processor ────────────────────────────────────

let processingActive = false;

function scheduleProcessing() {
  if (processingActive) return;
  processingActive = true;
  // Use setTimeout to avoid blocking the current request
  setTimeout(() => processNextJob(), 100);
}

async function processNextJob() {
  const job = jobRepo.getNextQueued();
  if (!job) {
    processingActive = false;
    return;
  }

  // Check if job was cancelled before we start
  const freshJob = jobRepo.getById(job.id);
  if (!freshJob || freshJob.status === "cancelled") {
    console.log(`[processor] Skipping cancelled job ${job.id}`);
    setTimeout(() => processNextJob(), 100);
    return;
  }

  console.log(`[processor] Starting job ${job.id}: ${job.filename}`);
  jobRepo.updateStatus(job.id, "processing");

  try {
    const documentContent = job.file_content || "";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `=== DOCUMENT: "${job.filename}" ===\n${documentContent}\n=== END OF "${job.filename}" ===`,
      }],
    });

    // Check if cancelled during AI call
    const jobAfterAI = jobRepo.getById(job.id);
    if (jobAfterAI?.status === "cancelled") {
      console.log(`[processor] Job ${job.id} cancelled during extraction`);
      setTimeout(() => processNextJob(), 100);
      return;
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from AI");
    }

    let jsonStr = textBlock.text.trim();
    if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    const parsed = JSON.parse(jsonStr);
    const extractedPolicies: any[] = parsed.policies || [];

    // Generate IDs and insert policies one-by-one as pending_review
    const existingIds = policyRepo.getAll().map((p) => p.id);
    let idCounter = existingIds.length > 0
      ? Math.max(...existingIds.map((id) => {
          const num = parseInt(id.split("-").pop() || "0", 10);
          return isNaN(num) ? 0 : num;
        })) + 1
      : 41;

    let insertedCount = 0;

    for (const p of extractedPolicies) {
      const policyId = `POL-2026-${String(idCounter++).padStart(3, "0")}`;
      const tagsArray: string[] = Array.isArray(p.tags) ? p.tags : [];
      const tagsStr = tagsArray.length > 0 ? JSON.stringify(tagsArray) : null;

      const row = {
        id: policyId,
        name: p.name,
        category: p.category ?? null,
        status: "pending_review",
        max_amount: p.maxAmount ?? null,
        limit_amount: p.limitAmount ?? 0,
        friction: p.friction ?? null,
        intent: p.intent ?? null,
        afas_code: p.afasCode ?? null,
        ledger: p.afasCode ? String(p.afasCode) : null,
        benchmark_score: null,
        benchmark_warning: false,
        allowed_categories: null,
        source_document: job.filename,
        start_date: p.startDate ?? null,
        end_date: p.endDate ?? null,
        extraction_job_id: job.id,
        tags: tagsStr,
      };

      // Insert this policy immediately
      policyRepo.upsert([row]);
      insertedCount++;

      // Update job count so frontend sees progress
      jobRepo.updateStatus(job.id, "processing", { policies_extracted: insertedCount });

      // Audit log
      auditRepo.log({
        policy_id: row.id,
        action: "created",
        changes_json: JSON.stringify(row),
        source: `ai_extraction:${job.id}`,
      });

      // ── Conflict detection via tag overlap ──────────────────────
      if (tagsArray.length > 0 && row.limit_amount > 0) {
        const allPolicies = policyRepo.getAll();
        const existingConflicts = conflictRepo.getAll();

        for (const existing of allPolicies) {
          if (existing.id === row.id) continue;
          if (existing.status === "deprecated") continue;
          if (existing.limit_amount === null || existing.limit_amount === 0) continue;
          if (existing.limit_amount === row.limit_amount) { continue; }

          // Parse existing policy tags
          let existingTags: string[] = [];
          try {
            if (existing.tags) existingTags = JSON.parse(existing.tags);
          } catch {}
          if (existingTags.length === 0) continue;

          // Compute tag overlap
          const overlap = tagsArray.filter((t) => existingTags.includes(t));
          if (overlap.length < 2) continue;

          // Check if conflict already exists for this pair (either direction)
          const alreadyExists = existingConflicts.some(
            (c) =>
              !c.resolved &&
              ((c.policy_a_id === existing.id && c.policy_b_id === row.id) ||
               (c.policy_a_id === row.id && c.policy_b_id === existing.id))
          );
          if (alreadyExists) {
            // Ensure both policies are marked as conflict even if the record already exists
            policyRepo.update(existing.id, { status: "conflict" });
            policyRepo.update(row.id, { status: "conflict" });
            continue;
          }

          const conflictId = `conflict-${crypto.randomUUID()}`;
          conflictRepo.create({
            id: conflictId,
            policy_a_id: existing.id,
            policy_b_id: row.id,
            conflict_field: `Limit amount: ${existing.max_amount || existing.limit_amount} vs ${row.max_amount || row.limit_amount}`,
            description: `Overlapping tags: [${overlap.join(", ")}]. "${existing.name}" (${existing.source_document || "existing"}) vs "${row.name}" (${row.source_document || "new"}).`,
          });

          policyRepo.update(existing.id, { status: "conflict" });
          policyRepo.update(row.id, { status: "conflict" });

          auditRepo.log({
            policy_id: existing.id,
            action: "conflict_detected",
            changes_json: JSON.stringify({ conflict_with: row.id, conflict_id: conflictId, overlapping_tags: overlap }),
            source: `ai_extraction:${job.id}`,
          });
          auditRepo.log({
            policy_id: row.id,
            action: "conflict_detected",
            changes_json: JSON.stringify({ conflict_with: existing.id, conflict_id: conflictId, overlapping_tags: overlap }),
            source: `ai_extraction:${job.id}`,
          });
        }
      }
    }

    jobRepo.updateStatus(job.id, "done", { policies_extracted: insertedCount });
    console.log(`[processor] Completed job ${job.id}: extracted ${insertedCount} policies`);
  } catch (e: any) {
    console.error(`[processor] Failed job ${job.id}:`, e);
    jobRepo.updateStatus(job.id, "error", { error_message: e.message || "Unknown error" });
  }

  // Process next job in queue
  setTimeout(() => processNextJob(), 500);
}

// ── Start server ─────────────────────────────────────────────────────

app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`API server running on http://0.0.0.0:${PORT}`);
  // Resume processing any queued jobs from before restart
  const queued = jobRepo.getNextQueued();
  if (queued) {
    console.log("[processor] Resuming queued jobs...");
    scheduleProcessing();
  }
});
