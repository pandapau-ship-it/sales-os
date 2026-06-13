import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X, Sparkles, RotateCw, Send, Check, Pencil } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import Avatar from "@/components/shared/Avatar";
import BrandLogo from "@/components/shared/BrandLogo";

/**
 * ChatActionPanel — gemeinsame Basis für ALLE Action-Panels (Deal stagniert,
 * LinkedIn Signal, Kalt …). Identischer Aufbau, identisches Chat-Design, identische
 * Breite (50vw) — pro Aktion nur anderer Inhalt (Banner, AI-Empfehlung, Entwurf, Aktionen).
 *
 * Aufbau:
 *   1. Header (Avatar · Name · Kontext-Badge · X)
 *   2. Fix oben: farbiger Hinweis-Banner + ganz kurze AI-Empfehlung
 *   3. AI-Chat (scrollbar) mit vorgefertigtem Entwurf als Karte (E-Mail oder LinkedIn)
 *   4. Sticky Chat-Eingabe + Disclaimer — alles läuft über den Chat
 */

export type Tone = "urgent" | "warn" | "info" | "cold" | "teal" | "success";
const TONE: Record<Tone, { bg: string; text: string }> = {
  urgent: { bg: "var(--signal-urgent-bg)", text: "var(--signal-urgent-text)" },
  warn: { bg: "var(--signal-warn-bg)", text: "var(--signal-warn-text)" },
  info: { bg: "var(--signal-info-bg)", text: "var(--signal-info-text)" },
  cold: { bg: "var(--signal-cold-bg)", text: "var(--signal-cold-text)" },
  teal: { bg: "var(--signal-teal-bg)", text: "var(--sherloq-primary)" },
  success: { bg: "var(--signal-success-bg)", text: "var(--signal-success-text)" },
};

export interface ChatPanelAction {
  label: string;
  icon?: ReactNode;
  primary?: boolean;
  toast: string;
  /** Panel nach der Aktion schließen (Default: true). */
  closeAfter?: boolean;
  /** Optionaler Callback (z. B. onApply/onTakeAction) — bekommt den aktuellen Entwurf. */
  run?: (body: string) => void;
}

export interface ChatActionConfig {
  person: { name: string; company: string; avatarUrl?: string };
  headerBadge: { label: string; tone: Tone };
  statusDotTone: Tone;
  banner: { tone: Tone; icon: ReactNode; label: string; text: string };
  recommendation: { text: string; confidence: number };
  draft: {
    channel: "email" | "linkedin";
    to: string;
    subject?: string;
    body: string;
    /** Body nach „Neu generieren" (Fallback: leichte Variation). */
    regenerated?: string;
  };
  intro: string;
  outro?: string;
  actions: ChatPanelAction[];
}

interface ChatActionPanelProps {
  open: boolean;
  config: ChatActionConfig | null;
  onClose: () => void;
}

type ChatMessage =
  | { id: number; role: "ai"; kind: "text"; text: string }
  | { id: number; role: "ai"; kind: "draft" }
  | { id: number; role: "user"; kind: "text"; text: string };

export default function ChatActionPanel({ open, config, onClose }: ChatActionPanelProps) {
  // Gehaltene Kopie, damit der Inhalt während der Ausfahr-Animation erhalten bleibt.
  const [display, setDisplay] = useState<ChatActionConfig | null>(config);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const prevOpen = useRef(false);
  const nextId = () => ++idRef.current;

  // Nur beim Öffnen (geschlossen → offen) neu seeden — Chat bleibt sonst erhalten.
  useEffect(() => {
    if (open && !prevOpen.current && config) {
      setDisplay(config);
      setEditing(false);
      setBody(config.draft.body);
      const seeded: ChatMessage[] = [
        { id: nextId(), role: "ai", kind: "text", text: config.intro },
        { id: nextId(), role: "ai", kind: "draft" },
      ];
      if (config.outro) seeded.push({ id: nextId(), role: "ai", kind: "text", text: config.outro });
      setMessages(seeded);
    }
    prevOpen.current = open;
  }, [open, config]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const s = display;
  const firstName = s?.person.name.split(" ")[0] ?? "";
  const lastName = s?.person.name.split(" ").pop() ?? "";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };
  const runAction = (a: ChatPanelAction) => {
    a.run?.(body);
    showToast(a.toast);
    if (a.closeAfter !== false) setTimeout(() => onClose(), 1100);
  };

  const handleRegenerate = () => {
    if (!s) return;
    setIsRegenerating(true);
    setTimeout(() => {
      setBody(s.draft.regenerated ?? `Hi ${firstName},\n\nich wollte kurz nachfassen — passt das Thema bei euch gerade? Gerne teile ich konkrete Zahlen. Hättest du diese Woche 15 Minuten?\n\nViele Grüße`);
      setIsRegenerating(false);
      showToast("Entwurf neu generiert");
    }, 700);
  };

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", kind: "text", text }]);
    const lowered = text.toLowerCase();
    setTimeout(() => {
      let reply = "Verstanden — ich passe den Entwurf an. Sag z. B. kürzer, förmlicher oder mit konkretem CTA.";
      if (lowered.includes("kürzer") || lowered.includes("kurz")) {
        setBody(`Hi ${firstName}, kurze Frage: passt das Thema bei euch gerade? Hättest du diese Woche 15 Min für einen kurzen Austausch?`);
        reply = "Ich habe den Entwurf gekürzt.";
      } else if (lowered.includes("förmlich")) {
        setBody(`Sehr geehrte/r Frau/Herr ${lastName},\n\nich wollte mich kurz erkundigen, ob das Thema bei Ihnen aktuell relevant ist. Hätten Sie diese Woche 15 Minuten für einen kurzen Austausch?\n\nMit freundlichen Grüßen`);
        reply = "Ich habe den Ton förmlicher gemacht.";
      }
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "text", text: reply }]);
    }, 450);
  };

  const isEmail = s?.draft.channel === "email";

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
        <SheetContent side="drawer" className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface" style={{ width: "50vw", maxWidth: "95vw", minWidth: 480 }}>
          {s && (
            <>
              {/* HEADER */}
              <header className="h-[70px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={s.person.name} src={s.person.avatarUrl} size={40} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-text-primary leading-none truncate">{s.person.name}</h3>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide shrink-0" style={{ background: TONE[s.headerBadge.tone].bg, color: TONE[s.headerBadge.tone].text }}>
                        {s.headerBadge.label}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-text-muted mt-1 truncate">{s.person.company}</p>
                  </div>
                </div>
                <SheetClose asChild>
                  <button className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </SheetClose>
              </header>

              {/* FIX OBEN: Hinweis-Banner + kurze AI-Empfehlung */}
              <div className="px-6 pt-4 pb-4 space-y-3 shrink-0 border-b border-border-subtle bg-app-surface">
                <div className="p-3.5 rounded-[12px] border" style={{ background: TONE[s.banner.tone].bg, borderColor: TONE[s.banner.tone].bg }}>
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest" style={{ color: TONE[s.banner.tone].text }}>
                    {s.banner.icon} {s.banner.label}
                  </div>
                  <p className="text-[13px] font-semibold leading-relaxed mt-1" style={{ color: TONE[s.banner.tone].text }}>
                    {s.banner.text}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--sherloq-primary)] uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" /> AI-Empfehlung
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[9px] font-extrabold">
                      {s.recommendation.confidence}% sicher
                    </span>
                  </div>
                  <p className="text-[13px] text-text-body font-medium leading-relaxed">{s.recommendation.text}</p>
                </div>
              </div>

              {/* AI-CHAT */}
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-app-bg px-5 py-5 space-y-4">
                {messages.map((m) => {
                  if (m.role === "user") {
                    return (
                      <div key={m.id} className="flex justify-end">
                        <div className="max-w-[82%] bg-[var(--signal-info-bg)] text-text-primary rounded-2xl rounded-tr-md px-3.5 py-2 text-[13px] font-medium leading-relaxed shadow-sm">
                          {m.text}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={m.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {m.kind === "text" ? (
                          <p className="text-[13px] text-text-body leading-relaxed pt-1">{m.text}</p>
                        ) : (
                          // Entwurf-Karte (E-Mail oder LinkedIn) — Claude-Code-Stil.
                          <div className="rounded-[12px] border border-border bg-app-surface shadow-[var(--shadow-card)] overflow-hidden">
                            <div className="px-4 py-2.5 bg-app-bg border-b border-border flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-[11px] font-bold text-text-muted uppercase tracking-wider min-w-0">
                                <BrandLogo name={isEmail ? "outlook" : "linkedin"} tile className="w-5 h-5 rounded-[5px] shrink-0" />
                                <span className="truncate">{isEmail ? "E-Mail-Entwurf" : "LinkedIn-Nachricht"}</span>
                              </span>
                              <button
                                onClick={() => setEditing((v) => !v)}
                                aria-label="Bearbeiten"
                                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${editing ? "bg-[var(--signal-teal-bg)] text-[var(--sherloq-primary)]" : "text-text-muted hover:text-text-primary hover:bg-app-surface"}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="p-4 space-y-2">
                              <div className="flex gap-2 text-[12px]">
                                <span className="text-text-muted w-12 shrink-0">An</span>
                                <span className="font-semibold text-text-body truncate">{s.draft.to}</span>
                              </div>
                              {isEmail && s.draft.subject && (
                                <div className="flex gap-2 text-[12px]">
                                  <span className="text-text-muted w-12 shrink-0">Betreff</span>
                                  <span className="font-semibold text-text-body truncate">{s.draft.subject}</span>
                                </div>
                              )}
                              <div className="border-t border-border-subtle pt-2.5">
                                {editing ? (
                                  <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    rows={8}
                                    className="w-full bg-app-bg border border-[var(--sherloq-primary)] rounded-[10px] p-3 text-[13px] text-text-primary leading-relaxed outline-none resize-none scrollbar-none"
                                  />
                                ) : (
                                  <p className="text-[13px] text-text-body leading-relaxed whitespace-pre-wrap">{body}</p>
                                )}
                              </div>
                            </div>
                            <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-wrap bg-app-surface">
                              {s.actions.map((a, i) => (
                                <button
                                  key={i}
                                  onClick={() => runAction(a)}
                                  className={
                                    a.primary
                                      ? "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                                      : "inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-app-surface border border-border text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer"
                                  }
                                  style={a.primary ? { background: "var(--sherloq-gradient)" } : undefined}
                                >
                                  {a.icon} {a.label}
                                </button>
                              ))}
                              <button
                                onClick={handleRegenerate}
                                aria-label="Neu generieren"
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-app-surface border border-border text-text-muted text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer"
                              >
                                <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? "animate-spin" : ""}`} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={msgEndRef} />
              </div>

              {/* CHAT-EINGABE (sticky) + Disclaimer */}
              <div className="shrink-0 border-t border-border bg-app-surface px-4 pt-3 pb-3">
                <div className="flex items-end gap-2 bg-app-bg border border-border rounded-[14px] px-3 py-2 focus-within:border-[var(--sherloq-primary)] focus-within:bg-app-surface transition-all">
                  <textarea
                    rows={1}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={`Sherloq zu ${firstName} fragen…`}
                    className="flex-1 bg-transparent resize-none outline-none text-[13px] font-medium leading-relaxed text-text-body placeholder-[var(--text-muted)] min-h-[28px] max-h-[96px] scrollbar-none py-1"
                  />
                  <button
                    onClick={handleSend}
                    aria-label="Senden"
                    className="w-9 h-9 rounded-full text-on-accent flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer shadow-sm"
                    style={{ background: "var(--sherloq-gradient)" }}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-text-muted text-center mt-2">
                  Sherloq AI kann Fehler machen — wichtige Infos bitte prüfen.
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[120] bg-inverse-surface text-on-accent px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-[var(--signal-success-text)]" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}
    </>
  );
}
