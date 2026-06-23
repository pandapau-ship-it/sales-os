import { ChatActionPanel } from '@/components';
import type { SignalActionData } from '@/lib/hunterMappers';
import { signalActionConfig } from '@/lib/signalActions';

// Single-Source des Typs liegt in hunterMappers (mit `signalToActionData`); hier re-exportiert,
// damit Bestandsimporte über `@/components` weiter funktionieren.
export type { SignalActionData } from '@/lib/hunterMappers';

interface SignalActionDrawerProps {
  signal: SignalActionData | null;
  onClose: () => void;
  onApply?: (draft: string) => void;
  onEdit?: () => void;
  onIgnore?: () => void;
  onCreateTask?: () => void;
}

/**
 * SignalActionDrawer — Action Panel für LinkedIn-Signale (ChatActionPanel-Basis). Echte Felder
 * (Name/Firma/ICP/Aktionstext/Zeit) kommen aus `signalToActionData`. AI-Felder (Empfehlung/Draft/
 * Confidence/Reaktionsfenster) sind NULL → das Panel zeigt einen ehrlichen „Folgt"-Platzhalter
 * statt erfundenem Text (AI-Pipeline siehe PROGRESS [D5]).
 *
 * Die Config wird NICHT mehr inline gebaut, sondern über den Resolver `signalActionConfig`
 * ([D35] Phase 0). So lässt sich die Datenquelle später (DB-Regeln) tauschen, ohne diesen Drawer
 * oder die Render-Schicht anzufassen. Handler werden hier per Action-Type gebunden.
 */
export default function SignalActionDrawer({
  signal,
  onClose,
  onApply,
  onCreateTask,
}: SignalActionDrawerProps) {
  const config = signalActionConfig(signal, { send_linkedin: onApply, create_task: onCreateTask });
  return <ChatActionPanel open={signal !== null} config={config} onClose={onClose} />;
}
