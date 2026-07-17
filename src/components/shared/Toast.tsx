/**
 * Toast — leichtgewichtiges Benachrichtigungssystem (kein externes Paket).
 *
 * <ToastProvider> einmal um die App legen, dann `const { toast } = useToast()`.
 * Erscheint oben rechts, verschwindet nach 3s. Varianten: success/info/warn/error.
 * Icons sind Lucide (kein Emoji, → Design Invariants).
 */

import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import { ToastContext, type ToastVariant, type ToastAction } from "./toastContext";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

const ICONS: Record<ToastVariant, typeof CheckCircle2> = {
  success: CheckCircle2,
  info: Info,
  warn: AlertTriangle,
  error: XCircle,
};

const ICON_COLOR: Record<ToastVariant, string> = {
  success: "text-signal-success",
  info: "text-signal-info",
  warn: "text-signal-warn",
  error: "text-signal-urgent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((prev) => prev.filter((t) => t.id !== id)), []);

  const toast = useCallback((message: string, variant: ToastVariant = "success", action?: ToastAction) => {
    const id = ++counter.current;
    setItems((prev) => [...prev, { id, message, variant, action }]);
    // Mit Aktion länger stehen lassen (User muss klicken können), sonst 3s.
    window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), action ? 6000 : 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
        {items.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role="status"
              className="sherloq-card px-4 py-3 flex items-center gap-2.5 text-[13px] min-w-[240px] max-w-[380px] toast-enter pointer-events-auto"
            >
              <Icon className={`w-4 h-4 shrink-0 ${ICON_COLOR[t.variant]}`} />
              <span className="text-text-body flex-1">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  onClick={() => { t.action!.onClick(); dismiss(t.id); }}
                  className="shrink-0 text-[12px] font-bold text-[var(--sherloq-primary)] hover:underline cursor-pointer"
                >
                  {t.action.label}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
