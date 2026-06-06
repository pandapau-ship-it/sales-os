import { useSyncExternalStore } from "react"

/**
 * useTheme — Light/Dark Mode über `<html data-theme="...">`.
 *
 * - Persistiert in localStorage ('theme')
 * - Setzt data-theme auf <html> → alle CSS-Token-Overrides greifen automatisch
 * - Modul-weiter Store: jede useTheme()-Instanz bleibt synchron (App, Sidebar, …)
 *
 * Keine Komponente muss Dark Mode kennen — Styling läuft ausschließlich über
 * die CSS Variablen in index.css. Dieser Hook flippt nur das Attribut.
 */

export type Theme = "light" | "dark"

const STORAGE_KEY = "theme"

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light"
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "light"
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === "dark" || stored === "light" ? stored : getSystemTheme()
}

// Apply to <html> immediately on module load (belt-and-suspenders with the
// inline FOUC guard in index.html).
function applyTheme(theme: Theme): void {
  if (typeof document !== "undefined") {
    document.documentElement.setAttribute("data-theme", theme)
  }
}

// ── Module-level store so all hook instances share one source of truth ───────
const listeners = new Set<() => void>()

function emit(): void {
  for (const l of listeners) l()
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme)
  applyTheme(theme)
  emit()
}

export function toggleTheme(): void {
  setTheme(getStoredTheme() === "dark" ? "light" : "dark")
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function getSnapshot(): Theme {
  return getStoredTheme()
}

// Ensure the attribute matches stored preference once the module loads.
applyTheme(getStoredTheme())

export function useTheme(): {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
} {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "light" as Theme)
  return { theme, toggleTheme, setTheme }
}
