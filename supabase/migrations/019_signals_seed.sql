-- 019_signals_seed.sql
-- Demo-Seed: ~5 echte signals-Rows für die Demo-Org, damit der Signals-Tab beim
-- Wiring (S-2) echte, GEMISCHTE Daten zeigt (verschiedene Typen, einer ohne Kontakt,
-- teils 'webhook' = externe Quelle). NUR Seed — kein Tab-Wiring, keine Karten-Änderung.
--
-- Idempotent: feste id-UUIDs + ON CONFLICT (id) DO UPDATE → re-runnable.
-- getSignals-Filter: alle Rows routed_to='hunter' + processed_at=NULL → passieren
--   sowohl getSignals(org) als auch getSignals(org, {routedTo:'hunter', processed:false}).
-- FKs: contact_id verweist auf die Demo-Seed-Kontakte (22222222-…-00N); eine Row null.
-- signal_data füllt {detail (={{topic}}), source_url, timestamp}. created_at gestaffelt.
-- signals trägt KEINEN audit/updated_at-Trigger (Event-Daten) → reiner Insert.

insert into signals
  (id, organization_id, contact_id, company_id, source, signal_type, signal_data, routed_to, created_at)
values
  ('55555555-5555-5555-5555-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000004',          -- Markus Wolf (PayGuard)
   null, 'webhook', 'linkedin_post_commented',
   '{"detail":"GTM-Strategie für 2026","source_url":"https://www.linkedin.com/feed/update/demo-1","timestamp":"2026-06-17T11:49:00Z"}'::jsonb,
   'hunter', now() - interval '11 minutes'),

  ('55555555-5555-5555-5555-000000000002',
   '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000001',          -- Anna Berger (Acme Robotics)
   null, 'sherloq', 'linkedin_post_liked',
   '{"detail":"Sales-Automation-Trends","source_url":"https://www.linkedin.com/feed/update/demo-2","timestamp":"2026-06-17T10:00:00Z"}'::jsonb,
   'hunter', now() - interval '2 hours'),

  ('55555555-5555-5555-5555-000000000003',
   '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000007',          -- Eva Schulz (MediCare Plus)
   null, 'webhook', 'linkedin_profile_view',
   '{"detail":"Profilbesuch nach Demo","source_url":"https://www.linkedin.com/in/eva-schulz-demo","timestamp":"2026-06-17T11:15:00Z"}'::jsonb,
   'hunter', now() - interval '45 minutes'),

  ('55555555-5555-5555-5555-000000000004',
   '00000000-0000-0000-0000-000000000001',
   '22222222-2222-2222-2222-000000000003',          -- Sarah Klein (Nordwind Logistik)
   null, 'sherloq', 'job_change',
   '{"detail":"Neue Rolle: VP Revenue","source_url":"https://www.linkedin.com/in/sarah-klein-demo","timestamp":"2026-06-17T07:00:00Z"}'::jsonb,
   'hunter', now() - interval '5 hours'),

  ('55555555-5555-5555-5555-000000000005',
   '00000000-0000-0000-0000-000000000001',
   null,                                             -- unbekannter Kontakt (Test null-Fall)
   null, 'webhook', 'custom',
   '{"detail":"Erwähnung in Branchen-News","source_url":"https://example.com/news/demo","timestamp":"2026-06-17T11:30:00Z"}'::jsonb,
   'hunter', now() - interval '30 minutes')

on conflict (id) do update set
  contact_id  = excluded.contact_id,
  company_id  = excluded.company_id,
  source      = excluded.source,
  signal_type = excluded.signal_type,
  signal_data = excluded.signal_data,
  routed_to   = excluded.routed_to,
  created_at  = excluded.created_at;       -- re-run frischt die relativen Zeiten auf
