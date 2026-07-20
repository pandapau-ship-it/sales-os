-- 078_mein_unternehmen_personal_voice.sql
-- „Mein Unternehmen" SLICE 2/3 — Personal Voice (Bauplan 8.B [SET-KB-2], ausgebautes O5).
-- Die eigene Schreibstimme JEDES Users (pro User, nicht org-weit). Klar getrennt von
-- contacts.personality_profile / analyze_personality() — das ist die Persönlichkeit des
-- EMPFÄNGERS, ein anderes Konzept; beide bleiben getrennt, keine Namens-Kollision.
--
-- Folgt dem GRUNDMUSTER aus 077 (Slice 1): field_meta mit `locked` als Schutz vor dem
-- späteren Website-/Content-Scan · alle Textfelder liegen unter jsonb (heute reiner String,
-- später {"de":…,"en":…} ohne Migration — Lese-Helfer src/lib/i18nText.ts versteht beide Formen).
--
-- BEREICHSWEITE REGEL (wie Slice 1): ALLE inhaltlichen Felder sind OPTIONAL. Pflicht sind
-- ausschließlich die technischen Spalten (id, organization_id, user_id). Der Nutzer füllt in
-- seinem Tempo; leere Felder zeigt die UI ehrlich leer, nie als Warnung.
--
-- STABILE FELD-PFADE (für die spätere AI-Chat-/generate_message()-Anbindung eingefroren —
-- HEUTE NICHT in fieldImportance.ts eintragen, es gibt noch keinen Verbraucher):
--   voice.overview.{bio,themes,style,tone}
--   voice.{post,comment,dm,email}.{samples,sentence_style,hooks,dos_donts}
--   voice.primary_channel
-- Die 4 Kanäle post/comment/dm stammen aus dem Referenz-Design; `email` ist die bewusste
-- 5. Ergänzung (das Design kennt es nicht, der AI SDR mailt aber primär).

create table if not exists voice_profiles (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  user_id          uuid not null references users(id) on delete cascade,
  -- Kanal-Objekte. jsonb-Werte im Inneren sind reine Strings (i18n-Andockhaken, siehe Kopf).
  overview         jsonb not null default '{}'::jsonb,   -- {bio, themes, style, tone}
  post             jsonb not null default '{}'::jsonb,    -- {samples, sentence_style, hooks, dos_donts}
  comment          jsonb not null default '{}'::jsonb,    -- gleiche Struktur wie post
  dm               jsonb not null default '{}'::jsonb,    -- gleiche Struktur wie post
  email            jsonb not null default '{}'::jsonb,    -- gleiche Struktur wie post
  -- Bevorzugter Ausgabe-Kanal (System-Enum: ein struktureller Bezeichner, kein [D51]-Wert).
  -- `overview` ist bewusst KEIN gültiger Wert — es ist die abgeleitete Zusammenfassung, kein
  -- Schreib-Kanal.
  primary_channel  text not null default 'email'
    check (primary_channel in ('post','comment','dm','email')),
  -- Feldpfad → {source: manual|crawl|sherloq|ai, updated_at, confidence, locked}.
  -- `locked` schützt Handarbeit vor dem SPÄTEREN Content-Scan (exakt wie org_profile in 077):
  -- was der Mensch angefasst hat, darf ein Re-Scan nie überschreiben. Muss JETZT existieren,
  -- sonst zerstört der erste Scan-Lauf gepflegte Inhalte unwiederbringlich. Rein intern, kein UI.
  field_meta       jsonb not null default '{}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  -- Eine Voice-Zeile pro (Org, User).
  unique (organization_id, user_id)
);

-- RLS: NUR eigene Zeile (user_id = auth.uid()) UND innerhalb der eigenen Org. Bewusst KEIN
-- Admin-Zugriff — visibility:'self'. Der „Admin hilft neuem Mitglied"-Fall ist ausdrücklich
-- NICHT Teil dieses Slices ([D-voice-admin-help], deferred). Muster aus 057 (user_preferences).
alter table voice_profiles enable row level security;
drop policy if exists "voice_profiles_own" on voice_profiles;
create policy "voice_profiles_own" on voice_profiles
  using (user_id = auth.uid() and organization_id = auth_org_id());

create index if not exists idx_voice_profiles_org_user on voice_profiles(organization_id, user_id);

-- updated_at automatisch (wie org_profile).
drop trigger if exists trg_voice_profiles_updated_at on voice_profiles;
create trigger trg_voice_profiles_updated_at before update on voice_profiles
  for each row execute function update_updated_at();

-- Audit-Log auf jeden Write (wie org_profile).
drop trigger if exists trg_voice_profiles_audit on voice_profiles;
create trigger trg_voice_profiles_audit after insert or update or delete on voice_profiles
  for each row execute function audit_write();
