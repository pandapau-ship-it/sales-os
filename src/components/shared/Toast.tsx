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
import { ToastContext, type ToastVariant } from "./toastContext";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
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

  const toast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++counter.current;
    setItems((prev) => [...prev, { id, message, variant }]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
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
              className="sherloq-card px-4 py-3 flex items-center gap-2.5 text-[13px] min-w-[240px] animate-fade-in pointer-events-auto"
            >
              <Icon className={`w-4 h-4 shrink-0 ${ICON_COLOR[t.variant]}`} />
              <span className="text-text-body">{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
