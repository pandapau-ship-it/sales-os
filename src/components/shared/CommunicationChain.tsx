import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone } from 'lucide-react';
import BrandLogo, { brandForChannel } from '@/components/shared/BrandLogo';
import type { BrandName } from '@/components/shared/BrandLogo';
import type { CommunicationView, CommunicationChannel } from '@/lib/hunterMappers';

/**
 * CommunicationChain — horizontaler Touchpoint-Zeitstrahl (Marken-Logos + grüne Fortschrittslinie)
 * mit Hover-Tooltip (Kanal · Datum · Richtung/Sentiment · Notiz).
 *  - `items` (bevorzugt): ECHTE communications (CommunicationView) → Tooltip mit Richtung.
 *  - `personId` (Legacy/Farmer-Mock): wenn keine items übergeben werden, deterministischer Mock-Strang.
 * Leer → null (der Aufrufer zeigt den Hinweis).
 */
interface ChainNode {
  id: string;
  label: string;
  brand?: BrandName;
  isCall: boolean;
  isPast: boolean;
  dateStr: string;
  tooltip: { channel: string; date: string; sub: string; note: string };
}

interface CommunicationChainProps {
  items?: CommunicationView[];
  /** Legacy-Mock (z. B. Farmer-Screen), solange dort keine echte Quelle existiert. */
  personId?: string;
  onSelectCommunication?: (contactId: string, tpId: string) => void;
}

const CHANNEL_META: Record<CommunicationChannel, { label: string; brandKey: string }> = {
  email: { label: 'E-Mail', brandKey: 'EMAIL' },
  linkedin: { label: 'LinkedIn', brandKey: 'LINKEDIN' },
  call: { label: 'Anruf', brandKey: 'PHONE' },
  meeting: { label: 'Meeting', brandKey: 'MEETING' },
};

// Legacy-Mock-Strang (nur Fallback ohne items) — deterministisch aus der id.
function legacyChain(id: string): ChainNode[] {
  let seed = 0;
  for (let i = 0; i < id.length; i++) seed += id.charCodeAt(i);
  const random = () => { const x = Math.sin(seed++) * 10000; return x - Math.floor(x); };
  const types = ['LINKEDIN', 'EMAIL', 'VIDEO', 'PHONE', 'MEETING', 'DOC'];
  const labels: Record<string, string> = { LINKEDIN: 'LinkedIn', EMAIL: 'Email', VIDEO: 'Demo', PHONE: 'Call', MEETING: 'Meeting', DOC: 'Angebot' };
  const sentiments = ['Positiv', 'Neutral', 'Interessiert', 'Wartend'];
  const n = Math.floor(random() * 4) + 4;
  let daysAgo = Math.floor(random() * 30) + 15;
  const out: ChainNode[] = [];
  for (let i = 0; i < n; i++) {
    const isPast = i < n - 2;
    const type = types[Math.floor(random() * types.length)];
    if (isPast) { daysAgo -= Math.floor(random() * 5) + 1; if (daysAgo < 1) daysAgo = 1; }
    out.push({
      id: `${id}-${i}`,
      label: labels[type],
      brand: brandForChannel(type, (i + id.length) % 2 === 1) ?? undefined,
      isCall: type === 'PHONE',
      isPast,
      dateStr: isPast ? `vor ${daysAgo}T` : (i === n - 2 ? 'offen' : 'geplant'),
      tooltip: {
        channel: labels[type],
        date: isPast ? `vor ${daysAgo} Tagen` : 'Ausstehend',
        sub: isPast ? sentiments[Math.floor(random() * sentiments.length)] : 'Ausstehend',
        note: isPast ? 'Kurzer Austausch via ' + labels[type] : 'Geplante Aktion',
      },
    });
  }
  return out;
}

function relShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'geplant';
  const d = Math.floor(diff / 86_400_000);
  if (d <= 0) return 'heute';
  return `vor ${d}T`;
}
function relLong(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'Ausstehend';
  const d = Math.floor(diff / 86_400_000);
  if (d <= 0) return 'heute';
  return `vor ${d} Tagen`;
}

export default function CommunicationChain({ items, personId, onSelectCommunication }: CommunicationChainProps) {
  const { t } = useTranslation();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Echte Daten bevorzugt; ohne items → Legacy-Mock (nur falls personId, sonst nichts).
  const chain: ChainNode[] = items
    ? [...items].reverse().map((it) => {
        const meta = CHANNEL_META[it.channel];
        const isPast = new Date(it.occurredAt).getTime() <= Date.now();
        return {
          id: it.id,
          label: meta.label,
          brand: brandForChannel(meta.brandKey, false) ?? undefined,
          isCall: it.channel === 'call',
          isPast,
          dateStr: relShort(it.occurredAt),
          tooltip: {
            channel: meta.label,
            date: relLong(it.occurredAt),
            sub: it.direction === 'outbound' ? 'Ausgehend' : 'Eingehend',
            note: it.note?.trim() || '—',
          },
        };
      })
    : (personId ? legacyChain(personId) : []);

  if (!chain.length) return null;

  const pastCount = chain.filter((c) => c.isPast).length;
  const progress = chain.length > 1 ? Math.max(0, (pastCount - 1)) / (chain.length - 1) * 100 : (pastCount ? 100 : 0);

  return (
    <div className="w-full bg-[var(--app-bg)] rounded-[20px] px-6 py-4 border border-[var(--border)]">
      <div className="text-[11px] font-bold font-mono text-[var(--text-muted)] uppercase tracking-wider mb-6 text-center">
        {t('hunter.chain.header')}
      </div>

      <div className="relative flex justify-between items-start w-full px-2 md:px-10 mt-4">
        {/* Durchgehende Linie + grüner Fortschritt */}
        <div className="absolute left-[43px] md:left-[75px] right-[43px] md:right-[75px] top-[24px] z-0">
          <div className="w-full h-[2px] bg-[var(--border)]" />
          <div className="absolute left-0 top-0 h-[2px] bg-[var(--accent-teal)] transition-all" style={{ width: `${progress}%` }} />
        </div>

        {chain.map((tp, idx) => (
          <div
            key={tp.id}
            className="relative flex flex-col items-center cursor-pointer group w-[70px] z-10"
            onMouseEnter={() => setHoveredId(tp.id)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onSelectCommunication?.('', tp.id)}
          >
            <div className="relative group/icon mb-2 w-full flex justify-center">
              <div
                className={`w-[46px] h-[46px] bg-app-surface rounded-full flex items-center justify-center transition-transform group-hover:scale-110 z-10 shadow-[0_0_0_6px_var(--app-bg)] relative ${hoveredId === tp.id ? 'ring-2 ring-[var(--accent-teal)]/30' : ''}`}
              >
                {tp.brand ? (
                  <BrandLogo name={tp.brand} className={`w-[30px] h-[30px] object-contain ${tp.isPast ? '' : 'grayscale opacity-40'}`} />
                ) : (
                  <Phone className={`w-[22px] h-[22px] text-[var(--channel-call)] ${tp.isPast ? '' : 'grayscale opacity-40'}`} strokeWidth={2} />
                )}
              </div>
              {tp.isPast && idx === pastCount - 1 && (
                <div className="absolute top-0 right-[4px] w-3 h-3 bg-[var(--accent-teal)] border-2 border-[var(--surface)] rounded-full z-20 group-hover:scale-110 transition-transform" />
              )}
            </div>

            <span className={`text-[12px] mt-1 font-bold ${tp.isPast ? 'text-[var(--text-body)]' : 'text-[var(--icon-muted)]'} text-center leading-tight`}>{tp.label}</span>
            <span className="text-[11px] text-[var(--icon-muted)] mt-0.5">{tp.dateStr}</span>

            {/* Hover-Tooltip: Kanal · Datum · Richtung · Notiz */}
            {hoveredId === tp.id && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-48 bg-app-surface border border-[var(--border)] shadow-[0_10px_30px_rgb(0,0,0,0.1)] rounded-xl p-3 z-50 animate-fade-in text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-[var(--sherloq-primary)] font-mono">{tp.tooltip.channel}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{tp.tooltip.date}</span>
                </div>
                <div className="text-[12px] text-[var(--text-body)] mb-1">{tp.tooltip.sub}</div>
                <div className="text-[11px] text-[var(--text-muted)] leading-snug line-clamp-2">{tp.tooltip.note}</div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-app-surface border-b border-r border-[var(--border)] rotate-45" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
