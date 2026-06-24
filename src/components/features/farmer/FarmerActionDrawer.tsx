import { ChatActionPanel } from '@/components';
import { farmerActionConfig, type FarmerActionData } from '@/lib/farmerActions';

// Single-Source der Signal-/Action-Typen liegt in lib/farmerActions; hier re-exportiert,
// damit Consumer (FarmerSidepanel/Kacheln) sie über diesen Drawer beziehen können.
export type { FarmerActionData, FarmerSignalKind, FarmerActionType } from '@/lib/farmerActions';

interface FarmerActionDrawerProps {
  /** Offen, wenn gesetzt; null = geschlossen (immer gemountet für die Ausfahr-Animation). */
  signal: FarmerActionData | null;
  onClose: () => void;
  /** Optionale Handler — werden beim Dispatch gebunden ([D34]/[D35]). Senden ist erst aktiv,
   *  wenn ein echter KI-Draft existiert ([D5]); bis dahin rendert der Renderer keine Buttons. */
  onRetention?: (body: string) => void;
  onReactivation?: (body: string) => void;
  onUpsell?: (body: string) => void;
  onWinbackCall?: () => void;
  onCreateTask?: () => void;
  onSnooze?: () => void;
}

/**
 * FarmerActionDrawer — EIN gemeinsames Action Panel für alle Farmer-Signale ([D34]). Schaltet je
 * `signal.kind` um (Slice 1: churn_risk + going_cold) und baut die Config über den Resolver
 * `farmerActionConfig` (Mirror von `signalActions`, D35-Muster). Renderer = `ChatActionPanel`
 * (1:1 wiederverwendet, UNVERÄNDERT). KI-Felder NULL → ehrlicher „Folgt"-Platzhalter wie Hunter.
 */
export default function FarmerActionDrawer({
  signal, onClose, onRetention, onReactivation, onUpsell, onWinbackCall, onCreateTask, onSnooze,
}: FarmerActionDrawerProps) {
  const config = farmerActionConfig(signal, {
    retention_message: onRetention,
    reactivation_message: onReactivation,
    upsell_message: onUpsell,
    winback_call: onWinbackCall,
    create_task: onCreateTask,
    snooze: onSnooze,
  });
  return <ChatActionPanel open={signal !== null} config={config} onClose={onClose} />;
}
