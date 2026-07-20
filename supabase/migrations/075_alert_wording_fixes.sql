-- 075_alert_wording_fixes.sql
-- Betriebs-Alarme (B-1): 3 Klartext-Texte verständlicher formuliert (Jargon raus, Bedeutung klarer).
-- LAUFZEIT-Quelle ist cron_expectations (der Watchdog baut die Meldung daraus) → hier angeglichen.
-- MUSS identisch zum TS-Spiegel src/lib/alertTemplates.ts bleiben (Spiegel-Prinzip). Andere 4 Texte
-- geprüft und unverändert (bereits klar). Additiv/idempotent (nur UPDATE bestehender Zeilen).

update cron_expectations set
  alert_what   = 'Der tägliche Check, ob Deals zu lange in einer Phase feststecken (Stagnation), ist nicht durchgelaufen.'
where job_name = 'score-deal-health-daily';

update cron_expectations set
  alert_what      = 'Die tägliche Prüfung, ob die verbrauchten Credits zum Monatsanfang zurückgesetzt werden müssen, ist nicht durchgelaufen.',
  alert_hypothesis = 'Vermutlich war die Datenbank kurz nicht erreichbar oder ein Zugang ist abgelaufen.',
  alert_meaning   = 'Zum Monatswechsel könnte das Credit-Guthaben nicht korrekt zurückgesetzt werden — dann stimmt die angezeigte Restmenge nicht.'
where job_name = 'credit-monthly-reset';

update cron_expectations set
  alert_what      = 'Das tägliche Aufräumen der internen Protokolle über automatische Hintergrund-Aufgaben ist nicht durchgelaufen.',
  alert_hypothesis = 'Vermutlich war die Datenbank kurz nicht erreichbar oder ein Zugang ist abgelaufen.',
  alert_meaning   = 'Diese internen Protokolle wachsen vorübergehend an — unkritisch, wird beim nächsten Lauf automatisch nachgeholt.'
where job_name = 'cron-runs-cleanup';
