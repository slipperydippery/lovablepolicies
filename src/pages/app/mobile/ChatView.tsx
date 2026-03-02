import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { toast } from "@/hooks/use-toast";
import { useActiveLocation } from "@/contexts/ActiveLocationContext";
import { CHAT_URL, fetchPolicies } from "@/lib/api";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  registerAmount?: number;
  appliedPolicies?: string[];
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Parse **bold** and *italic* markers into elements */
function renderFormattedText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}


/** Strip [REGISTER:xx.xx] markers and extract amount */
function parseRegisterMarker(text: string): { clean: string; amount: number | undefined } {
  const match = text.match(/\[REGISTER:([\d.]+)\]/);
  if (!match) return { clean: text, amount: undefined };
  return { clean: text.replace(/\[REGISTER:[\d.]+\]/, "").trim(), amount: parseFloat(match[1]) };
}

/** Strip [POLICIES:...] markers and extract policy IDs */
function parsePoliciesMarker(text: string): { clean: string; policyIds: string[] } {
  const match = text.match(/\[POLICIES:([^\]]*)\]/);
  if (!match) return { clean: text, policyIds: [] };
  const ids = match[1].split(",").map((s) => s.trim()).filter(Boolean);
  return { clean: text.replace(/\[POLICIES:[^\]]*\]/, "").trim(), policyIds: ids };
}

function timeNow() {
  return new Date().toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
}

/* ------------------------------------------------------------------ */
/*  Streaming helper                                                   */
/* ------------------------------------------------------------------ */

async function streamChat({
  messages,
  locationName,
  language,
  onDelta,
  onDone,
  signal,
}: {
  messages: { role: string; content: string }[];
  locationName: string;
  language: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  signal?: AbortSignal;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ messages, locationName, language }),
    signal,
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(body.error || `HTTP ${resp.status}`);
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const json = line.slice(6).trim();
      if (json === "[DONE]") { streamDone = true; break; }

      try {
        const parsed = JSON.parse(json);
        if (parsed.error) throw new Error(parsed.error);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch (e) {
        if (e instanceof Error && e.message) throw e;
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Final flush
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const json = raw.slice(6).trim();
      if (json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

/* ------------------------------------------------------------------ */
/*  Speech recognition hook                                            */
/* ------------------------------------------------------------------ */

function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);
  const { i18n } = useTranslation();

  const supported = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const speechLang = i18n.language?.startsWith("nl") ? "nl-NL" : "en-US";

  const toggle = useCallback(() => {
    if (!supported) return;
    if (listening && recRef.current) {
      recRef.current.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = speechLang;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, onResult, supported, speechLang]);

  return { listening, toggle, supported };
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ChatView() {
  const { t, i18n } = useTranslation();
  const { activeLocation } = useActiveLocation();

  const frictionLabel = (friction: string): string => {
    switch (friction.toLowerCase()) {
      case "low": return t("chat.frictionLow");
      case "medium": return t("chat.frictionMedium");
      case "high": return t("chat.frictionHigh");
      default: return friction;
    }
  };

  const WELCOME: ChatMessage = {
    id: "welcome",
    role: "assistant",
    content: t("chat.welcome"),
    timestamp: timeNow(),
  };
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRegisterSheet, setShowRegisterSheet] = useState(false);
  const [registerAmount, setRegisterAmount] = useState(0);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [expandedPolicies, setExpandedPolicies] = useState<Record<string, boolean>>({});
  const policyDataRef = useRef<Record<string, { name: string; category: string; maxAmount: string; friction: string; intent: string }>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Fetch policy names once on mount
  useEffect(() => {
    fetchPolicies().then((data) => {
      const map: Record<string, { name: string; category: string; maxAmount: string; friction: string; intent: string }> = {};
      data.forEach((p) => {
        map[p.id] = {
          name: p.name,
          category: p.category || "",
          maxAmount: p.max_amount || "",
          friction: p.friction || "",
          intent: p.intent || "",
        };
      });
      policyDataRef.current = map;
    });
  }, []);

  // Voice
  const handleVoiceResult = useCallback((text: string) => {
    setInputValue((prev) => (prev ? prev + " " + text : text));
  }, []);
  const { listening, toggle: toggleVoice, supported: voiceSupported } = useSpeechRecognition(handleVoiceResult);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Send message */
  const send = async () => {
    const text = inputValue.trim();
    if (!text || isStreaming) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: timeNow(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsStreaming(true);

    const history = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let assistantSoFar = "";
    const assistantId = crypto.randomUUID();
    const assistantTimestamp = timeNow();

    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { id: assistantId, role: "assistant" as const, content: assistantSoFar, timestamp: assistantTimestamp }];
      });
    };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        messages: history,
        locationName: activeLocation.name,
        language: i18n.language?.startsWith("nl") ? "nl" : "en",
        onDelta: upsert,
        onDone: () => {
          // Parse both markers from final text
          let text = assistantSoFar;
          const { clean: c1, amount } = parseRegisterMarker(text);
          text = c1;
          const { clean: c2, policyIds } = parsePoliciesMarker(text);
          text = c2;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: text, registerAmount: amount, appliedPolicies: policyIds.length ? policyIds : undefined }
                : m
            )
          );
          setIsStreaming(false);
        },
        signal: controller.signal,
      });
    } catch (e: any) {
      if (e.name === "AbortError") return;
      console.error(e);
      toast.error(e.message || t("chat.errorResponse"));
      setIsStreaming(false);
    }
  };

  const handleRegister = (amount: number) => {
    setRegisterAmount(amount);
    setShowRegisterSheet(true);
  };

  const handleSubmitPurchase = () => {
    setShowRegisterSheet(false);
    setReceiptFile(null);
    toast.success(t("chat.purchaseSubmitted"));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-sp-16 py-sp-16 space-y-sp-12 flex flex-col justify-end">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-sp-16 py-sp-12 text-sm leading-relaxed",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-grey-100 dark:bg-grey-800 text-foreground rounded-bl-md"
              )}
            >
              <p>{renderFormattedText(msg.content)}</p>
            </div>
            {msg.registerAmount !== undefined && (
              <Button
                variant="solid"
                className="mt-sp-8 w-full text-xs h-9 rounded-xl shadow-sm"
                onClick={() => handleRegister(msg.registerAmount!)}
              >
                <i className="fa-solid fa-receipt mr-sp-8" aria-hidden="true" />
                {t("chat.registerPurchase", { amount: msg.registerAmount.toFixed(2) })}
              </Button>
            )}
            {/* Applied Policies collapsible */}
            {msg.role === "assistant" && msg.appliedPolicies && msg.appliedPolicies.length > 0 && (
              <div className="mt-sp-4 w-full">
                <button
                  type="button"
                  onClick={() => setExpandedPolicies((prev) => ({ ...prev, [msg.id]: !prev[msg.id] }))}
                  className="flex items-center gap-sp-4 text-xs text-primary hover:text-primary/80 transition-colors py-1"
                >
                  <i
                    className={cn(
                      "fa-solid fa-chevron-right text-[10px] transition-transform",
                      expandedPolicies[msg.id] && "rotate-90"
                    )}
                    aria-hidden="true"
                  />
                  {t("chat.viewPolicies")}
                </button>
                {expandedPolicies[msg.id] && (
                  <div className="flex flex-col gap-sp-8 mt-sp-4">
                    {msg.appliedPolicies.map((pid) => {
                      const pol = policyDataRef.current[pid];
                      return (
                        <div
                          key={pid}
                          className="rounded-lg bg-primary/5 border border-primary/15 px-sp-12 py-sp-10"
                        >
                          <div className="flex items-center gap-sp-4">
                            <i className="fa-solid fa-shield-check text-primary text-xs" aria-hidden="true" />
                            <p className="text-xs font-semibold text-primary">{pol?.name || pid}</p>
                          </div>
                          {pol && (
                            <>
                              <div className="flex flex-wrap gap-sp-4 mt-sp-8">
                                {pol.category && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-grey-100 dark:bg-grey-700 px-2 py-0.5 text-[11px] text-muted-foreground">
                                    <i className="fa-solid fa-tag text-[9px]" aria-hidden="true" />
                                    {pol.category}
                                  </span>
                                )}
                                {pol.maxAmount && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-grey-100 dark:bg-grey-700 px-2 py-0.5 text-[11px] text-muted-foreground">
                                    <i className="fa-solid fa-coins text-[9px]" aria-hidden="true" />
                                    {t("chat.policyMaxAmount")} {pol.maxAmount}
                                  </span>
                                )}
                                {pol.friction && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-grey-100 dark:bg-grey-700 px-2 py-0.5 text-[11px] text-muted-foreground">
                                    <i className="fa-solid fa-circle-check text-[9px]" aria-hidden="true" />
                                    {frictionLabel(pol.friction)}
                                  </span>
                                )}
                              </div>
                              {pol.intent && (
                                <p className="text-[11px] italic text-muted-foreground mt-sp-8 pt-sp-4 border-t border-primary/10">
                                  {pol.intent}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <span className="text-[11px] text-muted-foreground mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {/* Typing indicator */}
        {isStreaming && messages[messages.length - 1]?.role === "user" && (
          <div className="mr-auto flex items-center gap-1 px-sp-16 py-sp-8">
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom input bar — unified pill */}
      <div className="bg-background px-sp-12 py-sp-8">
        <div className={cn(
          "flex items-center gap-sp-4 rounded-full border bg-grey-50 dark:bg-grey-800 px-sp-4 py-sp-4 transition-colors",
          listening ? "border-error" : "border-border"
        )}>
          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoice}
              className={cn(
                "flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-colors",
                listening
                  ? "bg-error text-white"
                  : "text-muted-foreground hover:text-foreground hover:bg-grey-200 dark:hover:bg-grey-700"
              )}
              aria-label={listening ? "Stop recording" : "Voice message"}
            >
              <i className={cn("fa-solid text-base", listening ? "fa-stop" : "fa-microphone")} aria-hidden="true" />
            </button>
          )}
          <input
            type="text"
            placeholder={t("chat.inputPlaceholder")}
            className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 px-sp-8"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={isStreaming}
          />
          <button
            type="button"
            onClick={send}
            disabled={isStreaming || !inputValue.trim()}
            className={cn(
              "flex items-center justify-center w-11 h-11 rounded-full shrink-0 transition-colors",
              isStreaming || !inputValue.trim()
                ? "text-muted-foreground"
                : "bg-primary text-primary-foreground shadow-sm"
            )}
            aria-label="Send message"
          >
            <i className="fa-solid fa-paper-plane text-sm" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Register Purchase Bottom Sheet */}
      <DialogPrimitive.Root open={showRegisterSheet} onOpenChange={setShowRegisterSheet}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className={cn(
              "fixed z-50 bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px]",
              "bg-background rounded-t-2xl shadow-lg",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom",
              "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
              "duration-300"
            )}
          >
            <div className="flex justify-center pt-sp-8 pb-sp-4">
              <div className="w-10 h-1 rounded-full bg-grey-300" />
            </div>

            <div className="px-sp-24 pb-sp-24">
              <DialogPrimitive.Title className="text-lg font-semibold text-foreground mb-sp-16">
                {t("chat.registerSheet.title")}
              </DialogPrimitive.Title>

              <div className="space-y-sp-12 mb-sp-16">
                <div className="rounded-lg bg-grey-50 dark:bg-grey-800 px-sp-16 py-sp-12">
                  <span className="text-xs text-muted-foreground block mb-1">{t("chat.registerSheet.amount")}</span>
                  <span className="text-sm font-semibold text-foreground">€ {registerAmount.toFixed(2)}</span>
                </div>
                <div className="rounded-lg bg-grey-50 dark:bg-grey-800 px-sp-16 py-sp-12">
                  <span className="text-xs text-muted-foreground block mb-1">{t("budget.location")}</span>
                  <span className="text-sm font-semibold text-foreground">{activeLocation.name}</span>
                </div>
              </div>

              <div className="mb-sp-16">
                <FileUpload
                  value={receiptFile}
                  onChange={(f) => setReceiptFile(f as File | null)}
                  accept="image/*"
                  description={t("chat.registerSheet.receipt")}
                  icon={
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-grey-800 dark:bg-grey-700 text-white">
                      <i className="fa-solid fa-camera text-xl" aria-hidden="true" />
                    </div>
                  }
                  filesLayout="list"
                />
              </div>

              <Button variant="solid" className="w-full mb-sp-8" onClick={handleSubmitPurchase}>
                <i className="fa-solid fa-paper-plane mr-sp-8" aria-hidden="true" />
                {t("chat.registerSheet.submit")}
              </Button>
              <DialogPrimitive.Close asChild>
                <button
                  type="button"
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  {t("common.cancel")}
                </button>
              </DialogPrimitive.Close>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </div>
  );
}
