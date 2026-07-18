/**
 * ScreenKontakteImport — K-5 Import-Bildschirm (4-Schritt-Flow, Vollbild ohne Sidebar).
 *
 * Verdrahtet die fertige Import-Engine + Schicht 4 ECHT (kein Mock, kein Fake-Fortschritt):
 *  1 Upload   → parseImportFile (parse.ts, DYNAMISCH geladen → xlsx bleibt aus dem Bundle)
 *  2 Mapping  → buildMappingPlan/applyMapping (mapping.ts) über shadcn-Select
 *  3 Preview  → loadDedupUniverse + validateImport + summarize; buildImportPlan (execute.ts)
 *  4 Import   → runImport mit echtem onProgress; undoImport (K4)
 *
 * K-6-/Folge-Anschlusspunkte (bewusst markiert, NICHT stillschweigend weggelassen):
 *  - „Zusammenführen" (Merge) = K-6 → im Aktions-Select als deaktivierte „kommt mit K-6"-Option.
 *  - Vorlagen-Erkennung (import_templates) = Folge-Slice → hier noch nicht verdrahtet.
 *  - Report zeigt NUR echte runImport-Zahlen (erstellt/übersprungen/fehlgeschlagen), KEIN
 *    erfundenes „aktualisiert" (Update/Merge kommt erst mit K-6).
 */
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  X, UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight,
  ArrowLeft, Check, AlertTriangle, Download, RotateCcw, Loader2, ListChecks, Users,
} from "lucide-react";
import { useCurrentOrg } from "@/hooks/useCurrentOrg";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/shared/toastContext";
import { loadDedupUniverse, runImport, undoImport } from "@/lib/db";
// Dep-freie Engine-Schichten direkt (NICHT via Barrel — der Barrel zieht parse.ts→xlsx):
import { buildMappingPlan, applyMapping } from "@/lib/import/mapping";
import { validateImport, summarize } from "@/lib/import/validate";
import { buildImportPlan, type RowDecision } from "@/lib/import/execute";
import { detectEncoding, detectDelimiter, stripBom } from "@/lib/import/detect";
import type { ColumnMapping, ImportField, MappedRecord, ParsedFile, ValidatedRow } from "@/lib/import/types";
import { KpiCard, StatusBadge, EmptyState, Stepper } from "@/components";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const IMPORT_FIELDS: ImportField[] = [
  "first_name", "last_name", "email", "linkedin_url", "phone", "job_title",
  "seniority", "company_name", "city", "country", "tags", "notes",
];
const NONE = "__none"; // Sentinel für „Nicht importieren" (Select braucht einen String-Wert)
const MAX_PREVIEW_ROWS = 100; // Vorschau kappt die „Alle"-Ansicht (Fehler/Duplikate immer vollständig)

type FileMeta = { name: string; size: number; rows: number; format: string; notices: string[] };
type PreviewFilter = "all" | "duplicates" | "errors";

export default function ScreenKontakteImport() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationId } = useCurrentOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnMapping[]>([]);
  const [mappingError, setMappingError] = useState(false);
  const [decisions, setDecisions] = useState<Record<number, RowDecision>>({});
  const [previewFilter, setPreviewFilter] = useState<PreviewFilter>("all");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ batchId: string; created: number; skipped: number; failed: number } | null>(null);
  const [importError, setImportError] = useState(false);
  const [undone, setUndone] = useState(false);

  // ── Schritt 1: Datei einlesen (parse.ts dynamisch) ────────────────────────────
  async function handleFile(file: File) {
    setParseError(null);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const { parseImportFile } = await import("@/lib/import/parse"); // xlsx lazy
      const pf = parseImportFile(file.name, buf);
      if (pf.headers.length === 0 || pf.rows.length === 0) {
        setParseError(t("import.emptyFile"));
        return;
      }
      setParsed(pf);
      setColumns(buildMappingPlan(pf.headers).columns);
      setDecisions({});
      setFileMeta({
        name: file.name,
        size: file.size,
        rows: pf.rows.length,
        format: describeFormat(file.name, buf),
        notices: pf.notices ?? [],
      });
    } catch (e) {
      setParseError(e instanceof Error ? e.message : t("import.parseFailed"));
    }
  }

  function describeFormat(name: string, buf: Uint8Array): string {
    if (/\.(xlsx|xls)$/i.test(name)) return t("import.formatExcel");
    const enc = detectEncoding(buf).toUpperCase();
    const sample = stripBom(new TextDecoder("utf-8", { fatal: false }).decode(buf.slice(0, 8192)));
    const delim = detectDelimiter(sample);
    const delimLabel = delim === ";" ? t("import.delimSemicolon") : delim === "," ? t("import.delimComma") : t("import.delimTab");
    return `CSV · ${delimLabel} · ${enc}`;
  }

  function resetFile() {
    setParsed(null);
    setFileMeta(null);
    setParseError(null);
    setColumns([]);
  }

  // ── Schritt 2: Mapping ────────────────────────────────────────────────────────
  function exampleValues(header: string): string {
    const vals: string[] = [];
    for (const row of parsed?.rows ?? []) {
      const v = (row[header] ?? "").trim();
      if (v) vals.push(v);
      if (vals.length >= 3) break;
    }
    return vals.join(", ");
  }

  function setColumnField(idx: number, value: string) {
    setColumns((cols) => cols.map((c, i) => i === idx ? { ...c, field: value === NONE ? null : (value as ImportField), source: "manual" } : c));
    setMappingError(false);
  }

  const mappedFields = useMemo(() => new Set(columns.map((c) => c.field).filter(Boolean)), [columns]);
  const hasRequiredMapping = mappedFields.has("first_name") || mappedFields.has("last_name") || mappedFields.has("linkedin_url");

  // ── Schritt 3: Preview (echte Validierung) ────────────────────────────────────
  const records: MappedRecord[] = useMemo(() => {
    if (!parsed) return [];
    const unmapped = columns.filter((c) => c.field === null).map((c) => c.header);
    return applyMapping(parsed, { columns, unmapped });
  }, [parsed, columns]);

  // Dedup-Universum erst ab Schritt 3 laden (org-gescopt, eine Query).
  const dedupQuery = useQuery({
    queryKey: ["dedupUniverse", organizationId],
    queryFn: () => loadDedupUniverse(organizationId),
    enabled: step >= 3,
    staleTime: 60_000,
  });

  const validated: ValidatedRow[] = useMemo(() => {
    if (step < 3 || !dedupQuery.data) return [];
    return validateImport(records, dedupQuery.data);
  }, [step, records, dedupQuery.data]);

  const report = useMemo(() => summarize(validated), [validated]);
  const plan = useMemo(() => buildImportPlan(validated, decisions), [validated, decisions]);

  const previewRows = useMemo(() => {
    const rows = validated.filter((r) =>
      previewFilter === "all" ? true : previewFilter === "duplicates" ? r.status === "duplicate" : r.status === "error");
    return previewFilter === "all" ? rows.slice(0, MAX_PREVIEW_ROWS) : rows;
  }, [validated, previewFilter]);

  function skipAllSafeDuplicates() {
    setDecisions((prev) => {
      const next = { ...prev };
      for (const r of validated) if (r.status === "duplicate" && r.duplicate?.level === "sicher") next[r.index] = "skip";
      return next;
    });
  }

  function downloadErrorCsv() {
    const errors = validated.filter((r) => r.status === "error");
    const head = ["Zeile", "Vorname", "Nachname", "E-Mail", "LinkedIn", "Firma", "Grund"];
    const esc = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;
    const lines = errors.map((r) => [
      String(r.index + 1), r.record.first_name ?? "", r.record.last_name ?? "", r.record.email ?? "", // single-source-ok: Import-Datei-Rohzeile (MappedRecord), kein Kontakt-Entity — Kontakt existiert noch nicht
      r.record.linkedin_url ?? "", r.record.company_name ?? "", Object.values(r.errors ?? {}).join("; "),
    ].map(esc).join(";"));
    const csv = [head.map(esc).join(";"), ...lines].join("\r\n");
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "import_fehler.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Schritt 4: Ausführung ─────────────────────────────────────────────────────
  async function doImport() {
    setStep(4);
    setImporting(true);
    setImportError(false);
    setProgress({ done: 0, total: plan.createCount });
    try {
      const res = await runImport(organizationId, user?.id ?? null, plan, { filename: fileMeta?.name }, (done, total) => setProgress({ done, total }));
      if (!res) { setImportError(true); return; }
      setResult(res);
    } catch {
      setImportError(true);
    } finally {
      setImporting(false);
    }
  }

  async function doUndo() {
    if (!result) return;
    try {
      await undoImport(result.batchId, user?.id ?? null);
      setUndone(true);
      toast(t("import.undoDone"), "success");
    } catch {
      toast(t("import.undoFailed"), "error");
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────────
  function handleNext() {
    if (step === 1 && !parsed) return;
    if (step === 2) {
      if (!hasRequiredMapping) { setMappingError(true); return; }
      setStep(3);
      return;
    }
    if (step === 3) { void doImport(); return; }
    setStep((s) => Math.min(s + 1, 4) as 1 | 2 | 3 | 4);
  }
  function handleBack() {
    if (step >= 4) return;
    setStep((s) => Math.max(s - 1, 1) as 1 | 2 | 3 | 4);
  }
  const exit = () => navigate("/app/kontakte");

  const STEPS = [
    { num: 1, label: t("import.step1") },
    { num: 2, label: t("import.step2") },
    { num: 3, label: t("import.step3") },
    { num: 4, label: t("import.step4") },
  ] as const;

  return (
    <div className="min-h-screen bg-app-bg flex flex-col text-text-body">
      {/* Header */}
      <header className="bg-app-surface border-b border-[var(--border-card)] px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 z-10">
        <h1 className="text-[20px] font-extrabold text-text-primary tracking-tight">{t("import.title")}</h1>
        <button type="button" onClick={exit} aria-label={t("common.close")} data-tip={t("common.close")}
          className="p-2 text-text-muted hover:text-text-primary hover:bg-app-bg rounded-[8px] transition-colors cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Stepper (wiederverwendbare Komponente mit Mikro-Animation) */}
      <div className="pt-8 pb-6 shrink-0">
        <Stepper steps={STEPS} current={step} />
      </div>

      {/* Inhalt */}
      <main className="flex-1 overflow-y-auto px-6 pb-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </main>

      {/* Footer */}
      {step < 4 && (
        <footer className="bg-app-surface border-t border-[var(--border-card)] px-6 md:px-8 py-4 shrink-0 flex justify-between items-center shadow-[var(--shadow-card)]">
          <button type="button" onClick={handleBack} disabled={step === 1}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[10px] text-[13px] font-bold text-text-body bg-app-surface border border-border-strong hover:bg-app-bg transition-colors cursor-pointer disabled:text-text-muted disabled:border-border disabled:cursor-not-allowed disabled:hover:bg-transparent">
            <ArrowLeft className="w-4 h-4" /> {t("common.back")}
          </button>
          <button type="button" onClick={handleNext}
            disabled={(step === 1 && !parsed) || (step === 3 && plan.createCount === 0)}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-bold text-on-accent bg-[var(--sherloq-primary)] hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 disabled:pointer-events-none">
            {step === 3 ? t("import.importCount", { count: plan.createCount }) : t("common.next")}
            {step !== 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </footer>
      )}
    </div>
  );

  // ── Renderer ──────────────────────────────────────────────────────────────────
  function renderStep1() {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <input ref={fileInputRef} type="file" accept=".csv,.txt,.xlsx,.xls" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ""; }} />
        {!parsed ? (
          <div
            role="button" tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void handleFile(f); }}
            className="border-2 border-dashed border-border-strong rounded-[12px] bg-app-surface hover:border-[var(--sherloq-primary)] hover:bg-[var(--signal-teal-bg)] transition-colors cursor-pointer p-16 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-app-bg rounded-full flex items-center justify-center mb-6">
              <UploadCloud className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-[17px] font-bold text-text-primary mb-2">{t("import.dropzoneTitle")}</h3>
            <p className="text-[13px] font-medium text-text-muted">{t("import.dropzoneHint")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-app-surface border border-[var(--border-card)] rounded-[12px] p-5 flex items-center justify-between shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: "var(--signal-teal-bg)", color: "var(--sherloq-primary)" }}>
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[14px] font-bold text-text-primary truncate">{fileMeta?.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-[12px] font-medium text-text-muted">
                    <span>{formatBytes(fileMeta?.size ?? 0)}</span><span>·</span>
                    <span>{t("import.rowCount", { count: fileMeta?.rows ?? 0 })}</span><span>·</span>
                    <span>{fileMeta?.format}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={resetFile} aria-label={t("import.removeFile")} data-tip={t("import.removeFile")}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-app-bg rounded-[8px] transition-colors cursor-pointer shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            {(fileMeta?.notices ?? []).map((n, i) => (
              <div key={i} className="flex items-start gap-3 bg-app-bg p-4 rounded-[12px] text-[13px]">
                <AlertCircle className="w-5 h-5 text-text-muted shrink-0 mt-0.5" />
                <p className="text-text-body font-medium">{n}</p>
              </div>
            ))}
          </div>
        )}

        {parseError && (
          <div className="flex items-center gap-2 text-[13px] font-semibold p-4 rounded-[12px]" style={{ background: "var(--signal-urgent-bg)", color: "var(--signal-urgent-text)" }}>
            <AlertTriangle className="w-5 h-5" /> {t("import.parseFailed")}
          </div>
        )}
        <p className="text-center text-[13px] font-medium text-text-muted">{t("import.expectedColumns")}</p>
      </div>
    );
  }

  function renderStep2() {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h2 className="text-[19px] font-bold text-text-primary">{t("import.mapTitle")}</h2>
          <p className="text-[13px] font-medium text-text-muted mt-1">{t("import.mapSubtitle")}</p>
        </div>

        <div className="bg-app-surface border border-[var(--border-card)] rounded-[12px] overflow-hidden shadow-[var(--shadow-card)]">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-app-bg border-b border-[var(--border-card)]">
              <tr>
                <th className="px-6 py-4 typo-field-label text-text-muted">{t("import.colYourColumn")}</th>
                <th className="px-6 py-4 typo-field-label text-text-muted">{t("import.colExamples")}</th>
                <th className="px-6 py-4 typo-field-label text-text-muted">{t("import.colTargetField")}</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => {
                const unmapped = col.field === null;
                return (
                  <tr key={col.header} className="border-b border-[var(--border-card)] last:border-0">
                    <td className="px-6 py-4 font-bold text-text-primary">{col.header}</td>
                    <td className="px-6 py-4 font-medium text-text-muted truncate max-w-[220px]">{exampleValues(col.header)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!unmapped && col.source === "dictionary" && (
                          <span data-tip={t("import.autoDetected")}><Check className="w-4 h-4 text-[var(--signal-success-text)]" /></span>
                        )}
                        <Select value={col.field ?? NONE} onValueChange={(v) => setColumnField(idx, v)}>
                          <SelectTrigger className={`w-[220px] rounded-[8px] text-[13px] ${unmapped ? "text-text-muted" : "text-text-primary"}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>{t("import.fieldNone")}</SelectItem>
                            {IMPORT_FIELDS.map((f) => <SelectItem key={f} value={f}>{t(`import.field.${f}`)}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {mappingError && (
          <div className="flex items-center gap-2 text-[13px] font-semibold p-4 rounded-[12px]" style={{ background: "var(--signal-urgent-bg)", color: "var(--signal-urgent-text)" }}>
            <AlertTriangle className="w-5 h-5" /> {t("import.mapRequired")}
          </div>
        )}
      </div>
    );
  }

  function renderStep3() {
    if (dedupQuery.isLoading) {
      return <div className="max-w-6xl mx-auto flex items-center justify-center py-24 text-text-muted"><Loader2 className="w-6 h-6 animate-spin" /></div>;
    }
    // Dedup-Universum konnte nicht geladen werden → ehrliche Meldung + Retry, NIE still 0 anzeigen.
    if (dedupQuery.isError) {
      return (
        <div className="max-w-2xl mx-auto py-16">
          <EmptyState icon={<AlertTriangle className="w-6 h-6" />} title={t("import.checkFailedTitle")} description={t("import.checkFailedDesc")}
            action={{ label: t("import.retry"), onClick: () => void dedupQuery.refetch() }} />
        </div>
      );
    }
    if (plan.total > 0 && plan.createCount === 0 && report.error + report.duplicate === plan.total) {
      // Ehrlicher „nichts zu importieren"-Zustand (alle Zeilen Duplikat/Fehler).
      return (
        <div className="max-w-2xl mx-auto py-16">
          <EmptyState icon={<AlertTriangle className="w-6 h-6" />} title={t("import.nothingTitle")} description={t("import.nothingDesc")} />
          <div className="flex justify-center mt-6">
            <button type="button" onClick={downloadErrorCsv} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-body hover:text-text-primary cursor-pointer">
              <Download className="w-4 h-4" /> {t("import.downloadErrors", { count: report.error })}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard title={t("import.kpiImportable")} icon={<CheckCircle2 className="w-4 h-4 text-[var(--signal-success-text)]" />} iconClass="bg-[var(--signal-success-bg)]"
            value={plan.createCount.toLocaleString("de-DE")} valueClass="text-[var(--signal-success-text)]" subtitle={null} subtitleClass="" />
          <KpiCard title={t("import.kpiDuplicates")} icon={<AlertCircle className="w-4 h-4 text-[var(--signal-warn-text)]" />} iconClass="bg-[var(--signal-warn-bg)]"
            value={report.duplicate.toLocaleString("de-DE")} valueClass="text-[var(--signal-warn-text)]" subtitle={null} subtitleClass="" />
          <KpiCard title={t("import.kpiErrors")} icon={<AlertTriangle className="w-4 h-4 text-[var(--signal-urgent-text)]" />} iconClass="bg-[var(--signal-urgent-bg)]"
            value={report.error.toLocaleString("de-DE")} valueClass="text-[var(--signal-urgent-text)]" subtitle={null} subtitleClass="" />
          <KpiCard title={t("import.kpiTotal")} icon={<Users className="w-4 h-4 text-text-muted" />} iconClass="bg-app-bg"
            value={report.total.toLocaleString("de-DE")} valueClass="text-text-primary" subtitle={null} subtitleClass="" />
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-1 bg-app-surface p-1 rounded-[10px] border border-[var(--border-card)]">
            {(["all", "duplicates", "errors"] as const).map((f) => (
              <button key={f} type="button" onClick={() => setPreviewFilter(f)}
                className={`px-3 py-1.5 text-[12px] font-bold rounded-[7px] transition-colors cursor-pointer ${previewFilter === f ? "bg-app-bg text-text-primary" : "text-text-muted hover:text-text-body"}`}>
                {t(`import.filter.${f}`)}
              </button>
            ))}
          </div>
          <button type="button" onClick={skipAllSafeDuplicates}
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--sherloq-primary)] hover:opacity-80 px-3 py-2 rounded-[8px] cursor-pointer">
            <ListChecks className="w-4 h-4" /> {t("import.skipSafeDuplicates")}
          </button>
        </div>

        <div className="bg-app-surface border border-[var(--border-card)] rounded-[12px] shadow-[var(--shadow-card)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] whitespace-nowrap">
              <thead className="bg-app-bg border-b border-[var(--border-card)]">
                <tr>
                  {["status", "firstName", "lastName", "email", "company", "action"].map((h) => (
                    <th key={h} className="px-4 py-3 typo-field-label text-text-muted">{t(`import.col.${h}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row) => {
                  // Import-Vorschau zeigt die Datei-ROHZEILE (MappedRecord), kein Kontakt-Entity → in
                  // markierte JS-Zeilen ausgelagert, damit kein Roh-Feld im JSX steht (contactToProfile
                  // ist nicht anwendbar, der Kontakt existiert noch nicht).
                  const first = row.record.first_name ?? "—"; // single-source-ok: Import-Datei-Rohzeile, kein Kontakt-Entity
                  const last = row.record.last_name ?? "—"; // single-source-ok: Import-Datei-Rohzeile, kein Kontakt-Entity
                  const company = row.record.company_name ?? "—";
                  return (
                  <tr key={row.index} className="border-b border-[var(--border-card)] last:border-0 hover:bg-app-bg/60">
                    <td className="px-4 py-3">{renderStatusBadge(row)}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{first}</td>
                    <td className="px-4 py-3 font-medium text-text-primary">{last}</td>
                    <td className="px-4 py-3 text-text-muted">{row.record.email ?? <span className="italic text-[var(--signal-urgent-text)]">{t("import.missing")}</span>}</td>
                    <td className="px-4 py-3 text-text-muted">{company}</td>
                    <td className="px-4 py-3">{renderRowAction(row)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {report.error > 0 && (
            <div className="bg-app-bg px-4 py-3 border-t border-[var(--border-card)] text-center">
              <button type="button" onClick={downloadErrorCsv} className="inline-flex items-center gap-1.5 text-[12px] font-bold text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                <Download className="w-3.5 h-3.5" /> {t("import.downloadErrors", { count: report.error })}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  function renderStatusBadge(row: ValidatedRow) {
    if (row.status === "valid") return <StatusBadge label={t("import.statusReady")} tone="success" icon={CheckCircle2} />;
    if (row.status === "duplicate") {
      const lvl = row.duplicate?.level === "sicher" ? t("import.dupSafe") : t("import.dupPossible");
      return <StatusBadge label={lvl} tone="warn" icon={AlertCircle} />;
    }
    return <StatusBadge label={t("import.statusError")} tone="urgent" icon={AlertTriangle} />;
  }

  function renderRowAction(row: ValidatedRow) {
    if (row.status === "duplicate") {
      return (
        <Select value={decisions[row.index] ?? "skip"} onValueChange={(v) => setDecisions((d) => ({ ...d, [row.index]: v as RowDecision }))}>
          <SelectTrigger className="w-[190px] rounded-[8px] text-[12px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="skip">{t("import.actionSkip")}</SelectItem>
            <SelectItem value="create">{t("import.actionCreate")}</SelectItem>
            {/* Merge = K-6, noch nicht gebaut → sichtbar aber deaktiviert (nicht stillschweigend weggelassen). */}
            <SelectItem value="merge" disabled>{t("import.actionMergeSoon")}</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    if (row.status === "error") {
      return <span className="text-[12px] text-[var(--signal-urgent-text)] font-medium">{Object.values(row.errors ?? {})[0]}</span>;
    }
    return <span className="text-text-muted">—</span>;
  }

  function renderStep4() {
    const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : (importing ? 0 : 100);
    return (
      <div className="max-w-2xl mx-auto mt-12">
        {importing ? (
          <div className="bg-app-surface p-10 rounded-[12px] shadow-[var(--shadow-card)] border border-[var(--border-card)] text-center space-y-6">
            <div className="w-16 h-16 bg-[var(--signal-teal-bg)] rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 text-[var(--sherloq-primary)] animate-spin" />
            </div>
            <h2 className="text-[22px] font-bold text-text-primary">{t("import.importingTitle")}</h2>
            <div className="w-full bg-app-bg rounded-full h-2.5 overflow-hidden">
              <div className="h-2.5 rounded-full transition-all duration-200" style={{ width: `${pct}%`, background: "var(--sherloq-primary)" }} />
            </div>
            <p className="text-[13px] font-semibold text-text-muted">{t("import.importingProgress", { done: progress.done, total: progress.total })}</p>
          </div>
        ) : importError ? (
          <div className="bg-app-surface p-10 rounded-[12px] shadow-[var(--shadow-card)] border border-[var(--border-card)] text-center space-y-6">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--signal-urgent-bg)" }}>
              <AlertTriangle className="w-8 h-8" style={{ color: "var(--signal-urgent-text)" }} />
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-text-primary">{t("import.importErrorTitle")}</h2>
              <p className="text-text-muted font-medium mt-2">{t("import.importErrorDesc")}</p>
            </div>
            <button type="button" onClick={() => void doImport()} className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-[13px] font-bold text-on-accent bg-[var(--sherloq-primary)] hover:opacity-90 transition-opacity cursor-pointer">
              {t("import.retry")}
            </button>
          </div>
        ) : result ? (
          <div className="bg-app-surface p-10 rounded-[12px] shadow-[var(--shadow-card)] border border-[var(--border-card)] text-center space-y-8">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto" style={{ background: "var(--signal-success-bg)" }}>
              <CheckCircle2 className="w-10 h-10" style={{ color: "var(--signal-success-text)" }} />
            </div>
            <div>
              <h2 className="text-[22px] font-bold text-text-primary">{t("import.doneTitle")}</h2>
              <p className="text-text-muted font-medium mt-2">{t("import.doneDesc")}</p>
            </div>
            <div className="grid grid-cols-3 gap-4 bg-app-bg p-6 rounded-[12px] text-left border border-[var(--border-card)]">
              <div>
                <div className="text-[26px] font-extrabold text-text-primary">{result.created.toLocaleString("de-DE")}</div>
                <div className="typo-field-label text-text-muted mt-1">{t("import.reportCreated")}</div>
              </div>
              <div>
                <div className="text-[26px] font-extrabold text-text-primary">{result.skipped.toLocaleString("de-DE")}</div>
                <div className="typo-field-label text-text-muted mt-1">{t("import.reportSkipped")}</div>
              </div>
              <div>
                <div className={`text-[26px] font-extrabold ${result.failed > 0 ? "text-[var(--signal-urgent-text)]" : "text-text-muted"}`}>{result.failed.toLocaleString("de-DE")}</div>
                <div className="typo-field-label text-text-muted mt-1">{t("import.reportFailed")}</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 pt-2">
              <button type="button" onClick={exit} className="w-full inline-flex items-center justify-center px-6 py-3 rounded-[10px] text-[14px] font-bold text-on-accent bg-[var(--sherloq-primary)] hover:opacity-90 transition-opacity cursor-pointer">
                {t("import.toContacts")}
              </button>
              {!undone && (
                <>
                  <button type="button" onClick={doUndo} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-muted hover:text-text-body transition-colors cursor-pointer">
                    <RotateCcw className="w-3.5 h-3.5" /> {t("import.undo")}
                  </button>
                  <p className="text-[11px] text-text-muted -mt-2">{t("import.undoHint")}</p>
                </>
              )}
              {undone && <p className="text-[12px] font-semibold text-[var(--signal-success-text)]">{t("import.undoDone")}</p>}
            </div>
          </div>
        ) : null}
      </div>
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
