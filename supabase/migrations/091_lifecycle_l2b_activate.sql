-- 091_lifecycle_l2b_activate.sql
-- Lifecycle-Baukasten L-2b — Abschluss: die drei Gruppe-1-Aktionen wieder auf `active`.
--
-- Reihenfolge (bewusst getrennt von 090, D4): 090 setzt sie INTERIM `coming_soon`, weil der Dispatch-
-- Switch (create_task/add_tag/add_to_list) erst mit dem Edge-Function-Deploy existiert. Deploy-Ablauf:
--   db push 090  →  functions deploy (evaluate-lifecycle-rules mit Dispatch + Handlern)  →  Live-Verifikation
--   →  db push 091 (diese Migration).  Erst jetzt sind die Aktionen anlegbar (Write-RPC) UND ausführbar.
update action_types set status = 'active' where key in ('create_task', 'add_tag', 'add_to_list');
