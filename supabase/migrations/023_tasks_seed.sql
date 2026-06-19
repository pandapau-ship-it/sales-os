-- 023_tasks_seed.sql
-- Demo-Tasks für den Follow-ups-Tab (T2) + Pipeline-Task-Liste (T3). Bewusst gemischt,
-- damit der Fällig-Filter (completed_at IS NULL AND due_at <= now()) sichtbar greift:
--   • mehrere überfällig (Tage/Wochen) + eine heute fällig            → erscheinen
--   • eine in der Zukunft + eine bereits erledigte (Kontrolle)        → erscheinen NICHT
-- FKs: contact_id = bestehende Demo-Kontakte (22222222-…-00N, durch Migration 019 belegt).
--   deal_id bleibt NULL — die Stage der Karte kommt zentral aus contactActiveStage(contact.deals),
--   nicht aus task.deal_id; die echten Deal-UUIDs liegen nicht im Repo (SQL-Editor-Seed).
-- due_at relativ zu now() (interval), damit „fällig/heute/zukünftig" bei jedem Re-Run stimmt.
-- Idempotent: feste UUIDs + ON CONFLICT (id) DO UPDATE. source/priority/channel gemischt.
-- Migration schreiben — `db push` macht der User.
--

insert into tasks
  (id, organization_id, contact_id, deal_id, assigned_to, title, description,
   due_at, completed_at, priority, channel, source)
values
  -- 1) überfällig (12 Tage) · manual · high · email                        → FÄLLIG
  ('66666666-6666-6666-6666-000000000001', '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000001', null, null,
   'ROI-Dokument an Anna senden', 'Berechnetes ROI-Sheet aus dem Demo-Call nachreichen.',
   now() - interval '12 days', null, 'high', 'email', 'manual'),

  -- 2) überfällig (5 Tage) · ai · urgent · linkedin                        → FÄLLIG
  ('66666666-6666-6666-6666-000000000002', '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000003', null, null,
   'Nachfassen zur Demo', 'Sarah hat nach der Demo nicht geantwortet — kurze Nachfass-DM.',
   now() - interval '5 days', null, 'urgent', 'linkedin', 'ai'),

  -- 3) überfällig (21 Tage / Wochen) · manual · medium · phone             → FÄLLIG
  ('66666666-6666-6666-6666-000000000003', '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000004', null, null,
   'Rückruf: offene Fragen zum Pricing', 'Markus wollte die Staffelpreise telefonisch klären.',
   now() - interval '21 days', null, 'medium', 'phone', 'manual'),

  -- 4) heute fällig (bereits fällig, -2h) · ai · high · email             → FÄLLIG (heute)
  ('66666666-6666-6666-6666-000000000004', '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000007', null, null,
   'Onboarding-Termin bestätigen', 'Eva den vorgeschlagenen Onboarding-Slot bestätigen.',
   now() - interval '2 hours', null, 'high', 'email', 'ai'),

  -- 5) KONTROLLE: in der Zukunft (+7 Tage) · manual · low · email          → erscheint NICHT
  ('66666666-6666-6666-6666-000000000005', '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000001', null, null,
   'Quartals-Check vorbereiten', 'Vorbereitung für den nächsten Quartals-Review (noch nicht fällig).',
   now() + interval '7 days', null, 'low', 'email', 'manual'),

  -- 6) KONTROLLE: bereits erledigt (completed_at gesetzt) · manual · medium → erscheint NICHT
  ('66666666-6666-6666-6666-000000000006', '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000003', null, null,
   'Vertrag versendet', 'Vertragsentwurf wurde versendet — Task abgeschlossen.',
   now() - interval '10 days', now() - interval '9 days', 'medium', 'email', 'manual')

on conflict (id) do update set
  organization_id = excluded.organization_id,
  contact_id      = excluded.contact_id,
  deal_id         = excluded.deal_id,
  assigned_to     = excluded.assigned_to,
  title           = excluded.title,
  description     = excluded.description,
  due_at          = excluded.due_at,
  completed_at    = excluded.completed_at,
  priority        = excluded.priority,
  channel         = excluded.channel,
  source          = excluded.source;
