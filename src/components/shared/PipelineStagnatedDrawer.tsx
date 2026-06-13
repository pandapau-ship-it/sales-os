import { useState, useEffect, useRef } from "react";
import { X, Clock, Sparkles, RotateCw, Send, Check, Pencil, ArrowUpRight } from "lucide-react";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import Avatar from "@/components/shared/Avatar";
import BrandLogo from "@/components/shared/BrandLogo";

interface StagnatedPerson {
  name: string;
  company: string;
  avatarUrl?: string;
  icpScore: number;
  daysStagnated: number;
  stageName: string;
  lastContactDays: number;
  arr: string;
  probability: string;
  aiRecommendation: string;
  aiInsight: string;
  tags: string[];
  confidence: number;
}

interface PipelineStagnatedDrawerProps {
  /** Offen, wenn gesetzt; null = geschlossen (für Ausfahr-Animation immer gemountet). */
  person: StagnatedPerson | null;
  onClose: () => void;
  onTakeAction: (text: string) => void;
}

/** Kanonische Stages (Spec §3.2) — kommen später aus settings.pipeline_stages. */
const PIPELINE_STAGES = ["Backlog", "Demo vereinbart", "Follow-up offen", "Onboarding offen", "Free Trial", "Gewonnen"];
function nextStageFor(current: string): string {
  const idx = PIPELINE_STAGES.findIndex((s) => s.toLowerCase().startsWith(current.trim().toLowerCase()));
  if (idx >= 0 && idx < PIPELINE_STAGES.length - 1) return PIPELINE_STAGES[idx + 1];
  return PIPELINE_STAGES[Math.min(Math.max(idx, 0) + 1, PIPELINE_STAGES.length - 1)];
}

/** Chat-Nachrichten: AI-Text, AI-E-Mail-Entwurf (Karte mit Aktionen) oder User-Text. */
type ChatMessage =
  | { id: number; role: "ai"; kind: "text"; text: string }
  | { id: number; role: "ai"; kind: "email"; to: string; subject: string; body: string }
  | { id: number; role: "user"; kind: "text"; text: string };

/**
 * PipelineStagnatedDrawer — Action Panel (580px) für stagnierte Deals, als AI-Chat-Flow:
 *   1. Oben fix: orangener „Deal stagniert"-Hinweis (Text wird später generiert) + ganz
 *      kurze AI-Empfehlung (basiert auf Lead, bisherigem Verlauf, Sales-Wissen).
 *   2. Darunter ein AI-Chat in unserem Design: bereits mit einem generierten E-Mail-Entwurf
 *      als Karte (Empfänger + Aktions-Buttons „E-Mail senden" etc., Claude-Code-Stil).
 *   3. Unten ein sticky Chat-Eingabefeld + Disclaimer — alles läuft über diesen Chat.
 * Gleiche Sheet-„drawer"-Shell wie die übrigen Panels (Slide-in/-out, X/Backdrop/Escape).
 */
export default function PipelineStagnatedDrawer({ person, onClose, onTakeAction }: PipelineStagnatedDrawerProps) {
  // Inhalt aus gehaltener Kopie, damit das Panel während der Ausfahr-Animation gefüllt bleibt.
  const [display, setDisplay] = useState<StagnatedPerson | null>(person);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const nextId = () => ++idRef.current;

  const s = display;
  const isOpen = person !== null;
  const firstName = s?.name.split(" ")[0] ?? "";
  const nextStage = s ? nextStageFor(s.stageName) : "";

  // Beim Öffnen: Chat mit AI-Intro + vorgefertigtem E-Mail-Entwurf seeden.
  useEffect(() => {
    if (!person) return;
    setDisplay(person);
    setEditing(false);
    const fn = person.name.split(" ")[0];
    const rcpt = `${person.name.toLowerCase().replace(/[^a-z ]/g, "").trim().split(/\s+/).join(".")}@${person.company.toLowerCase().replace(/[^a-z]/g, "")}.de`;
    setMessages([
      {
        id: nextId(),
        role: "ai",
        kind: "text",
        text: `Der Deal stagniert seit ${person.daysStagnated} Tagen in „${person.stageName}". Ich habe einen Reaktivierungs-Entwurf vorbereitet:`,
      },
      {
        id: nextId(),
        role: "ai",
        kind: "email",
        to: rcpt,
        subject: "Kurzer Abgleich nach unserer Demo",
        body: `Hi ${fn},\n\nnach unserer Demo ist es etwas ruhig geworden — ich wollte kurz nachfassen, ob das Thema BDR-Ramp-up bei euch intern noch Priorität hat.\n\nGerne teile ich einen kompakten ROI-Überblick, zugeschnitten auf euer Team. Hättest du diese Woche 15 Minuten für einen kurzen Austausch?\n\nViele Grüße`,
      },
      {
        id: nextId(),
        role: "ai",
        kind: "text",
        text: "Du kannst die E-Mail direkt senden, anpassen oder mir sagen, was ich ändern soll.",
      },
    ]);
  }, [person]);

  // Auto-Scroll ans Chat-Ende bei neuen Nachrichten.
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };
  const actAndClose = (msg: string, body: string) => {
    onTakeAction(body);
    showToast(msg);
    setTimeout(() => onClose(), 1100);
  };

  const updateEmailBody = (body: string) =>
    setMessages((prev) => prev.map((m) => (m.kind === "email" ? { ...m, body } : m)));

  const handleRegenerate = () => {
    setIsRegenerating(true);
    setTimeout(() => {
      updateEmailBody(
        `Hi ${firstName},\n\ndanke nochmal für die Demo. Mich interessiert, ob das Thema intern weiter priorisiert wird — hast du diese Woche 15 Minuten für einen kurzen Abgleich? Ich bringe einen konkreten ROI-Case mit.\n\nViele Grüße`,
      );
      setIsRegenerating(false);
      showToast("Entwurf neu generiert");
    }, 700);
  };

  const handleSend = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChatInput("");
    setMessages((prev) => [...prev, { id: nextId(), role: "user", kind: "text", text }]);
    // Mock-Antwort: einfache Befehle passen den Entwurf an, sonst Bestätigung.
    const lowered = text.toLowerCase();
    setTimeout(() => {
      let reply = "Verstanden — ich passe den Entwurf an. Sag z. B. kürzer, förmlicher oder mit konkretem CTA.";
      if (lowered.includes("kürzer") || lowered.includes("kurz")) {
        updateEmailBody(`Hi ${firstName}, wie ist der interne Stand nach unserer Demo? Hast du diese Woche 15 Min für einen kurzen Abgleich?`);
        reply = "Ich habe den Entwurf gekürzt.";
      } else if (lowered.includes("förmlich")) {
        updateEmailBody(`Sehr geehrte/r Frau/Herr ${s?.name.split(" ").pop()},\n\nich wollte mich erkundigen, wie der interne Stand nach unserer Demo ist. Hätten Sie diese Woche 15 Minuten für einen kurzen Austausch?\n\nMit freundlichen Grüßen`);
        reply = "Ich habe den Ton förmlicher gemacht.";
      }
      setMessages((prev) => [...prev, { id: nextId(), role: "ai", kind: "text", text: reply }]);
    }, 450);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="drawer" className="flex flex-col font-sans overflow-hidden p-0 bg-app-surface" style={{ width: 580, maxWidth: "95vw" }}>
          {s && (
            <>
              {/* HEADER */}
              <header className="h-[70px] px-6 border-b border-border flex items-center justify-between shrink-0 bg-app-surface z-30">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <Avatar name={s.name} src={s.avatarUrl} size={40} />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--signal-urgent-text)] border-2 border-[var(--surface)] rounded-full"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-bold text-text-primary leading-none truncate">{s.name}</h3>
                      <span className="px-2 py-0.5 rounded-full bg-[var(--signal-success-bg)] border border-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[9px] font-extrabold tracking-wide shrink-0">
                        ICP: {s.icpScore}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-text-muted mt-1 truncate">{s.company}</p>
                  </div>
                </div>
                <SheetClose asChild>
                  <button className="w-8 h-8 rounded-full bg-app-bg flex items-center justify-center text-text-muted hover:text-text-primary transition-colors cursor-pointer shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </SheetClose>
              </header>

              {/* FIX OBEN: Stagniert-Hinweis + kurze AI-Empfehlung */}
              <div className="px-6 pt-4 pb-4 space-y-3 shrink-0 border-b border-border-subtle bg-app-surface">
                {/* Orangener Hinweis — Text wird später serverseitig generiert
                    (score_deal_health: daysStagnated/stageName/last_contacted_at). */}
                <div className="p-3.5 bg-[var(--signal-urgent-bg)] border border-[var(--signal-urgent-bg)] rounded-[12px]">
                  <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--signal-urgent-text)] uppercase tracking-widest">
                    <Clock className="w-3 h-3" /> Deal stagniert
                  </div>
                  <p className="text-[13px] text-[var(--signal-urgent-text)] font-semibold leading-relaxed mt-1">
                    {s.daysStagnated} Tage in „{s.stageName}" · seit {s.lastContactDays} Tagen kein Kontakt
                  </p>
                </div>

                {/* AI-Empfehlung — ganz kurz, basiert auf Lead + Verlauf + Sales-Wissen */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--sherloq-primary)] uppercase tracking-widest">
                      <Sparkles className="w-3 h-3" /> AI-Empfehlung
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--signal-success-bg)] text-[var(--signal-success-text)] text-[9px] font-extrabold">
                      {s.confidence}% sicher
                    </span>
                  </div>
                  <p className="text-[13px] text-text-body font-medium leading-relaxed">{s.aiRecommendation}</p>
                </div>
              </div>

              {/* AI-CHAT (scrollbar) */}
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
                  // AI-Nachricht (Text oder E-Mail-Karte) — mit Sparkles-Avatar.
                  return (
                    <div key={m.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--sherloq-primary)] text-on-accent flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {m.kind === "text" ? (
                          <p className="text-[13px] text-text-body leading-relaxed pt-1">{m.text}</p>
                        ) : (
                          // E-Mail-Entwurf als Karte (Claude-Code-Stil) mit Aktionen.
                          <div className="rounded-[12px] border border-border bg-app-surface shadow-[var(--shadow-card)] overflow-hidden">
                            <div className="px-4 py-2.5 bg-app-bg border-b border-border flex items-center justify-between gap-2">
                              <span className="flex items-center gap-2 text-[11px] font-bold text-text-muted uppercase tracking-wider min-w-0">
                                <BrandLogo name="outlook" tile className="w-5 h-5 rounded-[5px] shrink-0" />
                                <span className="truncate">E-Mail-Entwurf</span>
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
                                <span className="font-semibold text-text-body truncate">{m.to}</span>
                              </div>
                              <div className="flex gap-2 text-[12px]">
                                <span className="text-text-muted w-12 shrink-0">Betreff</span>
                                <span className="font-semibold text-text-body truncate">{m.subject}</span>
                              </div>
                              <div className="border-t border-border-subtle pt-2.5">
                                {editing ? (
                                  <textarea
                                    value={m.body}
                                    onChange={(e) => updateEmailBody(e.target.value)}
                                    rows={8}
                                    className="w-full bg-app-bg border border-[var(--sherloq-primary)] rounded-[10px] p-3 text-[13px] text-text-primary leading-relaxed outline-none resize-none scrollbar-none"
                                  />
                                ) : (
                                  <p className="text-[13px] text-text-body leading-relaxed whitespace-pre-wrap">{m.body}</p>
                                )}
                              </div>
                            </div>
                            <div className="px-4 py-3 border-t border-border flex items-center gap-2 flex-wrap bg-app-surface">
                              <button
                                onClick={() => actAndClose("E-Mail gesendet", m.body)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-on-accent text-[12px] font-bold shadow-sm hover:scale-[1.02] transition-transform cursor-pointer"
                                style={{ background: "var(--sherloq-gradient)" }}
                              >
                                <Send className="w-3.5 h-3.5" /> E-Mail senden
                              </button>
                              <button
                                onClick={() => actAndClose(`Gesendet · Stage → ${nextStage}`, m.body)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-app-surface border border-border text-text-body text-[12px] font-bold hover:bg-app-bg transition-colors cursor-pointer"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" /> Senden + Stage → {nextStage}
                              </button>
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
