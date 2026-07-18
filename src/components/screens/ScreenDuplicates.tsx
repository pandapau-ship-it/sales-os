/**
 * ScreenDuplicates — K-6b „Duplikate verwalten" (Vollbild-Route /app/kontakte/duplicates).
 *
 * Echt verdrahtet an K-6a: getDuplicatePairs/getCompanyDuplicatePairs (sicher + möglich),
 * mergeContacts/mergeCompanies (Feld-Merge + FK-Kaskade), softDeleteContacts/softDeleteCompanies
 * (dritte Aktion „Datensatz löschen"). Alle destruktiven Aktionen (Merge, Löschen) laufen über
 * einen alert-dialog (Bestätigung). Tabs Kontakte|Companies. Tokens/i18n, kein Mock, kein Fake.
 */
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, Building2, GitMerge, AlertTriangle, AlertCircle, CheckCircle2, Info, MoreHorizontal, Trash2, Check } from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/shared/toastContext";
import {
  getDuplicatePairs, getCompanyDuplicatePairs, mergeContacts, mergeCompanies,
  softDeleteContacts, softDeleteCompanies, type DuplicatePairView, type CompanyDuplicatePairView,
} from "@/lib/db";
import { diffFields } from "@/lib/merge";
import { Avatar, StatusBadge, EmptyState, PanelSkeleton } from "@/components";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Tab = "contacts" | "companies";
type Rec = Record<string, unknown>;

// Anzeige-/Merge-Felder (skalar). Company (Firmenname) ist beim Kontakt Anzeige-Kontext, kein Merge-Feld.
const FIELDS_CONTACT = ["first_name", "last_name", "email", "linkedin_url", "job_title", "seniority", "department", "city", "country"];
const FIELDS_COMPANY = ["name", "domain", "website", "industry", "size_range", "city", "country"];

const str = (v: unknown) => (v == null ? "" : String(v));

export default function ScreenDuplicates() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "companies" ? "companies" : "contacts");
  const [dismissed, setDismissed] = useState<Set<string>>(new Set()); // „Kein Duplikat" — lokal (Persistenz = K-6b Folge)
  const [mergePair, setMergePair] = useState<{ a: Rec; b: Rec; fields: string[] } | null>(null);
  const [selections, setSelections] = useState<Record<string, "A" | "B">>({});
  const [confirmMerge, setConfirmMerge] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);

  const contactsQuery = useQuery({
    queryKey: ["duplicatePairs", organizationId], queryFn: () => getDuplicatePairs(organizationId),
    enabled: tab === "contacts", staleTime: 30_000,
  });
  const companiesQuery = useQuery({
    queryKey: ["companyDuplicatePairs", organizationId], queryFn: () => getCompanyDuplicatePairs(organizationId),
    enabled: tab === "companies", staleTime: 30_000,
  });
  const q = tab === "contacts" ? contactsQuery : companiesQuery;

  const pairs = useMemo(() => {
    const raw = (q.data ?? []) as (DuplicatePairView | CompanyDuplicatePairView)[];
    return raw
      .map((p) => ({ ...p, key: [(p.a as { id: string }).id, (p.b as { id: string }).id].sort().join("|") }))
      .filter((p) => !dismissed.has(p.key));
  }, [q.data, dismissed]);

  const fields = tab === "contacts" ? FIELDS_CONTACT : FIELDS_COMPANY;
  const nameOf = (r: Rec) => tab === "contacts" ? `${str(r.first_name)} ${str(r.last_name)}`.trim() || str((r.company as { name?: string })?.name) || str(r.email) || "—" : str(r.name) || str(r.domain) || "—"; // single-source-ok: Duplikat-Screen vergleicht/merged bewusst die CRM-Rohfelder selbst
  const subOf = (r: Rec) => tab === "contacts" ? str((r.company as { name?: string })?.name) : str(r.domain);
  const detailOf = (r: Rec) => tab === "contacts" ? str(r.email) : str(r.website);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: [tab === "contacts" ? "duplicatePairs" : "companyDuplicatePairs", organizationId] });
    void qc.invalidateQueries({ queryKey: ["kontakte", organizationId] });
    void qc.invalidateQueries({ queryKey: ["companies", organizationId] });
  };

  const mergeMutation = useMutation({
    mutationFn: async () => {
      if (!mergePair) return;
      const winnerId = (mergePair.a as { id: string }).id;
      const loserId = (mergePair.b as { id: string }).id;
      // Overrides = die Pro-Feld-Wahl des Users (A/B) für abweichende Felder.
      const overrides: Record<string, unknown> = {};
      for (const f of mergePair.fields) overrides[f] = selections[f] === "B" ? mergePair.b[f] : mergePair.a[f];
      if (tab === "contacts") await mergeContacts(organizationId, winnerId, loserId, overrides, user?.id ?? null);
      else await mergeCompanies(organizationId, winnerId, loserId, overrides, user?.id ?? null);
    },
    onSuccess: () => { setConfirmMerge(false); setMergePair(null); invalidate(); toast(t("duplicates.mergedToast"), "success"); },
    onError: (e) => toast((e as Error).message, "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { if (tab === "contacts") await softDeleteContacts(organizationId, [id], user?.id ?? null); else await softDeleteCompanies(organizationId, [id], user?.id ?? null); },
    onSuccess: () => { setConfirmDelete(null); invalidate(); toast(t("duplicates.deletedToast"), "success"); },
    onError: (e) => toast((e as Error).message, "error"),
  });

  function openMerge(a: Rec, b: Rec) {
    const { differing } = diffFields(a, b, fields);
    const pre: Record<string, "A" | "B"> = {};
    for (const f of differing) pre[f] = "A"; // Vorauswahl A (Basis/befüllter Datensatz), pro Feld änderbar
    setSelections(pre);
    setMergePair({ a, b, fields: differing });
  }
  function dismiss(key: string) { setDismissed((s) => new Set(s).add(key)); toast(t("duplicates.dismissedToast"), "info"); }

  return (
    <div className="h-screen bg-app-bg flex flex-col text-text-body">
      {/* Header */}
      <header className="bg-app-surface border-b border-[var(--border-card)] px-6 py-4 shrink-0 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div>
            <button type="button" onClick={() => navigate("/app/kontakte")} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer mb-1">
              <ArrowLeft className="w-4 h-4" /> {t("duplicates.backToList")}
            </button>
            <h1 className="text-[22px] font-extrabold text-text-primary tracking-tight flex items-center gap-2">
              {t("duplicates.title")}
              {!q.isLoading && pairs.length > 0 && (
                <span className="bg-app-bg text-text-muted text-[12px] font-bold px-2.5 py-1 rounded-[7px] tabular-nums">{t("duplicates.count", { count: pairs.length })}</span>
              )}
            </h1>
          </div>
          {/* Tabs Kontakte | Companies */}
          <div className="flex items-center gap-1 p-1 bg-app-bg rounded-[10px]">
            {(["contacts", "companies"] as const).map((tb) => (
              <button key={tb} type="button" onClick={() => setTab(tb)}
                className={cn("inline-flex items-center gap-2 px-4 py-2 text-[13px] font-bold rounded-[7px] transition-colors cursor-pointer",
                  tab === tb ? "bg-app-surface text-text-primary shadow-[var(--shadow-card)]" : "text-text-muted hover:text-text-body")}>
                {tb === "contacts" ? <Users className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                {t(`duplicates.tab.${tb}`)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Inhalt */}
      <main className="flex-1 min-h-0 overflow-y-auto px-6 py-8">
        <div className="max-w-5xl mx-auto">
          {q.isLoading ? (
            <PanelSkeleton rows={3} height={92} />
          ) : q.isError ? (
            <EmptyState icon={<AlertTriangle className="w-6 h-6" />} title={t("duplicates.errorTitle")} description={t("duplicates.errorDesc")} action={{ label: t("common.retry"), onClick: () => void q.refetch() }} />
          ) : pairs.length === 0 ? (
            <EmptyState icon={<CheckCircle2 className="w-6 h-6" />} title={t("duplicates.emptyTitle")} description={t("duplicates.emptyDesc")} />
          ) : (
            <div className="space-y-4">
              {pairs.map((p) => {
                const a = p.a as Rec, b = p.b as Rec;
                return (
                  <div key={p.key} className="bg-app-surface border border-[var(--border-card)] rounded-[12px] shadow-[var(--shadow-card)] p-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                      {renderRecord(a, "left")}
                      {/* Konfidenz */}
                      <div className="flex flex-col items-center gap-2 px-2">
                        <StatusBadge label={p.level === "sicher" ? t("duplicates.levelSure") : t("duplicates.levelPossible")} tone={p.level === "sicher" ? "warn" : "muted"} icon={p.level === "sicher" ? AlertTriangle : AlertCircle} />
                        <span className="typo-field-label text-text-muted text-center">{reasonLabel(p.matchType)}</span>
                      </div>
                      {renderRecord(b, "right")}
                    </div>
                    {/* Aktionen */}
                    <div className="flex md:flex-col justify-end gap-2 md:pl-6 md:border-l border-[var(--border-card)] shrink-0">
                      <button type="button" onClick={() => openMerge(a, b)}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[10px] text-[13px] font-bold text-on-accent bg-[var(--sherloq-primary)] hover:opacity-90 transition-opacity cursor-pointer">
                        <GitMerge className="w-4 h-4" /> {t("duplicates.merge")}
                      </button>
                      <button type="button" onClick={() => dismiss(p.key)}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-[10px] text-[13px] font-bold text-text-body bg-app-surface border border-border-strong hover:bg-app-bg transition-colors cursor-pointer">
                        {t("duplicates.notDuplicate")}
                      </button>
                      {/* 3. Aktion: Überlauf-Menü „Datensatz löschen" (softDelete, kein Merge) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger aria-label={t("duplicates.moreActions")} data-tip={t("duplicates.moreActions")}
                          className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-text-muted hover:text-text-primary hover:bg-app-bg transition-colors cursor-pointer self-center">
                          <MoreHorizontal className="w-4 h-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setConfirmDelete({ id: str(a.id), name: nameOf(a) })} className="gap-2 cursor-pointer text-[var(--signal-urgent-text)]">
                            <Trash2 className="w-4 h-4" /> {t("duplicates.deleteRecord", { name: nameOf(a) })}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmDelete({ id: str(b.id), name: nameOf(b) })} className="gap-2 cursor-pointer text-[var(--signal-urgent-text)]">
                            <Trash2 className="w-4 h-4" /> {t("duplicates.deleteRecord", { name: nameOf(b) })}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Merge-Dialog */}
      <Dialog open={!!mergePair} onOpenChange={(o) => { if (!o) setMergePair(null); }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("duplicates.merge")}</DialogTitle>
            <p className="text-[13px] font-medium text-text-muted">{t("duplicates.mergeSubtitle")}</p>
          </DialogHeader>
          {mergePair && (
            <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
              {mergePair.fields.length === 0 ? (
                <p className="text-[13px] text-text-muted">{t("duplicates.noDiff")}</p>
              ) : (
                <>
                  <p className="typo-field-label text-text-muted">{t("duplicates.clarifyFields")}</p>
                  {mergePair.fields.map((f) => (
                    <div key={f} className="grid grid-cols-2 gap-3">
                      {(["A", "B"] as const).map((side) => {
                        const rec = side === "A" ? mergePair.a : mergePair.b;
                        const val = str(rec[f]);
                        const active = selections[f] === side;
                        return (
                          <button key={side} type="button" onClick={() => setSelections((s) => ({ ...s, [f]: side }))}
                            className={cn("relative text-left p-3 rounded-[10px] border transition-colors cursor-pointer",
                              active ? "bg-[var(--signal-teal-bg)] border-[var(--sherloq-primary)]" : "bg-app-surface border-border hover:border-border-strong")}>
                            <div className="typo-field-label text-text-muted mb-0.5">{t(`duplicates.field.${f}`)}</div>
                            <div className={cn("text-[13px] font-semibold", val ? "text-text-primary" : "text-text-muted italic")}>{val || t("duplicates.missing")}</div>
                            {active && <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--sherloq-primary)] flex items-center justify-center"><Check className="w-3 h-3 text-on-accent" /></span>}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </>
              )}
              <div className="flex items-start gap-3 p-4 rounded-[10px]" style={{ background: "var(--signal-info-bg)" }}>
                <Info className="w-5 h-5 shrink-0 mt-0.5" style={{ color: "var(--signal-info-text)" }} />
                <p className="text-[13px] font-medium" style={{ color: "var(--signal-info-text)" }}>{t("duplicates.honestyNote")}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <button type="button" onClick={() => setMergePair(null)} className="px-5 py-2.5 rounded-[10px] text-[13px] font-bold text-text-body bg-app-surface border border-border-strong hover:bg-app-bg transition-colors cursor-pointer">{t("common.cancel")}</button>
            <button type="button" onClick={() => setConfirmMerge(true)} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-bold text-on-accent bg-[var(--sherloq-primary)] hover:opacity-90 transition-opacity cursor-pointer">
              <GitMerge className="w-4 h-4" /> {t("duplicates.merge")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bestätigung Merge (destruktiv → immer alert-dialog) */}
      <AlertDialog open={confirmMerge} onOpenChange={setConfirmMerge}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("duplicates.confirmMergeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{mergePair ? t("duplicates.confirmMergeDesc", { winner: nameOf(mergePair.a), loser: nameOf(mergePair.b) }) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => mergeMutation.mutate()} disabled={mergeMutation.isPending}>{t("duplicates.merge")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bestätigung Löschen (3. Aktion) */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => { if (!o) setConfirmDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("duplicates.confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDelete ? t("duplicates.confirmDeleteDesc", { name: confirmDelete.name }) : ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deleteMutation.mutate(confirmDelete.id)} disabled={deleteMutation.isPending} className="bg-[var(--signal-urgent-text)] hover:opacity-90">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderRecord(r: Rec, side: "left" | "right") {
    const name = nameOf(r);
    return (
      <div className={cn("flex items-center gap-3 min-w-0", side === "right" && "flex-row-reverse text-right")}>
        <Avatar name={name} size={44} className="shrink-0" />
        <div className="min-w-0">
          <h4 className="typo-card-title text-text-primary truncate">{name}</h4>
          {subOf(r) && <div className={cn("flex items-center gap-1.5 text-[12px] text-text-muted mt-0.5 truncate", side === "right" && "flex-row-reverse")}><Building2 className="w-3 h-3 shrink-0" /><span className="truncate">{subOf(r)}</span></div>}
          {detailOf(r) && <div className="text-[12px] text-text-muted mt-0.5 truncate">{detailOf(r)}</div>}
        </div>
      </div>
    );
  }

  function reasonLabel(matchType: string): string {
    return t(`duplicates.reason.${matchType}`, t("duplicates.reason.name_company"));
  }
}
