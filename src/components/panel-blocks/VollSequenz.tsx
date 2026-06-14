/**
 * VollSequenz — „Cold Outreach"-Sequenz-Karte der Vollansicht (Sequenz-Tab).
 * Extrahiert aus features/hunter/ScreenVollansicht.tsx (Inhalt/Verhalten unverändert).
 */
import { Square } from "lucide-react";

export default function VollSequenz() {
  return (
    <div className="bg-app-surface rounded-[12px] p-8 shadow-sm border border-[var(--border)]">
      <div className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-[var(--text-muted)] text-[13px] font-bold uppercase tracking-widest flex items-center gap-2 mb-2">
            <Square className="w-4 h-4 text-[var(--icon-muted)]" /> COLD OUTREACH LINKEDIN
          </h2>
          <div className="text-[var(--text-muted)] text-[14px]">Schritt 2 von 4 · Nächste Task in 2 Tagen · Gestartet 25. Mai 2026</div>
        </div>
        <div className="text-[20px] font-semibold text-[var(--text-primary)]">Aktiv</div>
      </div>

      <div className="relative pl-[22px] border-l-2 border-[var(--border)] flex flex-col gap-10 pb-4 ml-6">
        {/* Step 1 */}
        <div className="relative">
          <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-app-surface border-2 border-[var(--sherloq-primary)] flex items-center justify-center text-[var(--sherloq-primary)]">
            <Square className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[var(--signal-success-bg)] flex items-center justify-center text-[var(--sherloq-primary)]">
              <Square className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[var(--text-primary)] text-[16px] mr-2">Erste Email senden</span>
              <span className="font-semibold text-[13px] text-[var(--text-primary)]">Erledigt · 25. Mai</span>
              <div className="text-[var(--text-muted)] text-[13px] mt-0.5">Tag 0 · Startschritt</div>
            </div>
          </div>
          <div className="mt-3 ml-11 bg-[var(--app-bg)] rounded-xl p-4 text-[var(--text-body)] text-[15px] border-l-4 border-[var(--sherloq-primary)]">
            Hallo Herr Krause, ich habe Ihren Beitrag über Sales Intelligence gelesen und wollte mich vorstellen...
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative">
          <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-[var(--sherloq-primary)] flex items-center justify-center text-on-accent font-bold text-sm">2</div>
          <div className="flex items-center gap-3">
            <div className="font-bold text-[var(--text-muted)] w-8 h-8 flex items-center justify-center text-[18px]">in</div>
            <div>
              <span className="font-bold text-[var(--text-primary)] text-[16px] mr-2">LinkedIn Vernetzung</span>
              <span className="font-semibold text-[13px] text-[var(--text-primary)]">Aktiv · fällig 31. Mai</span>
              <div className="text-[var(--text-muted)] text-[13px] mt-0.5">Tag 3 · Nächste Aufgabe</div>
            </div>
          </div>
          <div className="mt-3 ml-11 bg-[var(--app-bg)] rounded-xl p-4 text-[var(--text-body)] text-[15px] border-l-4 border-[var(--sherloq-primary)]">
            <strong>AI-Entwurf: </strong>
            Hallo Maximilian, ich habe Ihren Post über Sales Automation gesehen — sehr spannend! Würde mich freuen uns zu vernetzen.
            <div className="mt-4 flex items-center gap-3">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--sherloq-primary)] text-on-accent font-bold text-[14px] hover:opacity-90 transition-colors">
                <Square className="w-4 h-4 opacity-70" /> Jetzt senden
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-app-surface border border-[var(--border-strong)] text-[var(--text-primary)] font-bold text-[14px] hover:bg-[var(--app-bg)] transition-colors">
                <Square className="w-4 h-4 text-[var(--text-muted)]" /> Bearbeiten
              </button>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative">
          <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-app-surface border-2 border-[var(--border-strong)] flex items-center justify-center text-[var(--icon-muted)] font-bold text-sm">3</div>
          <div className="flex items-center gap-3 opacity-50">
            <div className="font-bold text-[var(--text-muted)] w-8 h-8 flex items-center justify-center text-[18px]">in</div>
            <div>
              <span className="font-bold text-[var(--text-primary)] text-[16px]">LinkedIn DM</span>
              <div className="text-[var(--text-muted)] text-[13px] mt-0.5">Tag 8 · ab 5. Juni 2026</div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="relative">
          <div className="absolute -left-[37px] top-0 w-[30px] h-[30px] rounded-full bg-app-surface border-2 border-[var(--border-strong)] flex items-center justify-center text-[var(--icon-muted)] font-bold text-sm">4</div>
          <div className="flex items-center gap-3 opacity-50">
            <div className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)]">
              <Square className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[var(--text-primary)] text-[16px]">Follow-up Email</span>
              <div className="text-[var(--text-muted)] text-[13px] mt-0.5">Tag 13 · ab 10. Juni 2026</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
