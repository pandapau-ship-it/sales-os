/**
 * Toast-Context + Zugriffs-Hook — bewusst getrennt von `Toast.tsx`.
 *
 * Fast Refresh tauscht nur Module, die ausschließlich Komponenten exportieren. Lägen
 * `useToast` und `ToastProvider` in derselben Datei, verlöre jede Änderung am Toast-UI
 * den Provider-State der ganzen App (react-refresh/only-export-components).
 */
import { createContext, useContext } from "react";

export type ToastVariant = "success" | "info" | "warn" | "error";

/** Optionale Aktion im Toast (z.B. „Liste ansehen") — kein automatischer Sprung, User entscheidet. */
export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastApi {
  toast: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
}

export const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast muss innerhalb von <ToastProvider> genutzt werden.");
  return ctx;
}
