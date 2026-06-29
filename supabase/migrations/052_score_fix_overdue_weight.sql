-- 052_score_fix_overdue_weight.sql
-- SCORE-FIX (B): churn_weights.overdue_tasks → 0.
--
-- Begründung: „überfällige offene Tasks" misst die To-do-Disziplin des Account Managers, NICHT die
-- Kundengesundheit. Solange die echten Usage-Signale (D49: Login-Frequenz, Nutzung hoch/runter) als
-- ERWEITERTE Schicht (Progressive Data Logic) noch fehlen, verzerrt dieses eine Basis-Signal den
-- Churn-Score überproportional (Demo: Sarah Klein 72 aus diesem EINEN Signal). Gewicht auf 0.
--
-- Chirurgisch: jsonb_set ändert NUR thresholds.churn_weights.overdue_tasks; alle anderen Gewichte/
-- Schwellen bleiben unangetastet. Idempotent (erneuter Lauf setzt erneut 0). trg_settings_audit (010)
-- loggt den Write. score-churn-risk liest die Gewichte FRISCH aus settings → wirkt ab nächstem Lauf.
-- Architektur (data_sources[], Normalisierung über verfügbare Punkte) bleibt unverändert; die starke
-- Usage-Schicht dockt mit D49 an. Hier wird NUR das eine Gewicht neutralisiert.

update settings
set thresholds = jsonb_set(thresholds, '{churn_weights,overdue_tasks}', '0'::jsonb, true),
    updated_at = now()
where thresholds ? 'churn_weights';
