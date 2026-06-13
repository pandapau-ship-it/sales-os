/**
 * PanelFooter — fixierte Aktionsleiste des Info-Panels (Task · Mail · LinkedIn · Notiz).
 * Extrahiert aus shared/HunterSidepanel.tsx.
 */
import { Plus, Mail, StickyNote } from "lucide-react";
import LinkedinIcon from "@/components/shared/LinkedinIcon";

const BTN =
  "px-3.5 py-2 border border-border hover:bg-app-bg text-text-body rounded-full text-[12px] font-bold flex-1 transition-colors shadow-sm cursor-pointer hover:-translate-y-0.5 flex items-center justify-center gap-1.5";

export default function PanelFooter({ onAction }: { onAction?: (key: string) => void }) {
  return (
    <footer className="p-4 border-t border-border-subtle bg-app-surface shrink-0 flex items-center justify-between gap-2 shadow-sm relative z-10">
      <button onClick={() => onAction?.("task")} className={BTN}><Plus className="w-3.5 h-3.5" /> Task</button>
      <button onClick={() => onAction?.("mail")} className={BTN}><Mail className="w-3.5 h-3.5" /> Mail</button>
      <button onClick={() => onAction?.("linkedin")} className={BTN}><LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn</button>
      <button onClick={() => onAction?.("note")} className={BTN}><StickyNote className="w-3.5 h-3.5" /> Notiz</button>
    </footer>
  );
}
