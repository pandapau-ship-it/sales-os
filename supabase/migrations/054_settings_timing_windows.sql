-- 054_settings_timing_windows.sql
-- [D51] Konfigurierbarkeit-als-Architektur: die Tages-Cutoffs der Score-Funktionen (vorher Code-Literale
-- in score-churn-risk/score-upsell) werden nach settings.thresholds.timing_windows verschoben — pro Org,
-- laufzeit-gelesen, chat-änderbar. Code-Literale bleiben nur als Fallback einzelner jsonb-Keys; die Edge
-- Functions scheitern bei settings-Read-Fehler LAUT (if sErr throw) — kein stiller Default.
--
-- Idempotent: shallow-Merge (||) ergänzt NUR den Top-Level-Key timing_windows in thresholds; vorhandene
-- Keys (churn_weights/upsell_weights/heat_status/…) bleiben unangetastet. Erneuter Lauf setzt dieselben Werte.
-- trg_settings_audit (010) loggt den Write.

-- Zusätzlich: churn_suppresses_upsell (Churn-Vorrang-Schalter, [D51] FIX 3). Regel-Logik bleibt im Code
-- (applyFarmerDisplayPrecedence), nur der An/Aus-Schalter ist hier konfigurierbar. Default true = aktueller Stand.
update settings
set thresholds = thresholds || '{
  "timing_windows": {
    "last_contact_days": 30,
    "inactive_days": 14,
    "recent_contact_days": 7
  },
  "churn_suppresses_upsell": true
}'::jsonb,
    updated_at = now();
