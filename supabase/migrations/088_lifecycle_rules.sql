-- 088_lifecycle_rules.sql
-- Lifecycle-Trigger-Baukasten — L-1 (Backend-Fundament, KEIN UI, KEIN Auswerter).
-- Grundlage: PROGRESS.md [D-lifecycle-trigger] + Diagnose/Plan (Reihenfolge-Diagnose + Bibliotheks-Inventar).
--
-- Was hier entsteht:
--   (1) lifecycle_rules      — die Regel selbst; conditions in OPTION-B-Form (Cross-Entity)
--   (2) lifecycle_rule_runs  — Match-Zustand je (Regel, Datensatz) für die EINMAL-FEUER-Semantik (L-2)
--   (3) action_types         — Aktions-Registry ALS DATEN (global); Builder+Auswerter lesen sie zur Laufzeit
--   (4) plan_limits-Seed     — Feature 'lifecycle_rules' (konfigurierbar je Plan; intern = -1 unbegrenzt)
--   (5) RPCs upsert/delete   — EIN Schreibweg (Mensch + späterer KI-Chat), automation.manage-Gate,
--                              Validierung der Option-B-Form, serverseitiger plan_limit-Blocker
--   (6) audit-Trigger        — jeder Regel-Write → audit_log (create/update/delete)
--
-- CONDITIONS-FORM (Option B, entschieden): die logische Bedingung besteht aus der Spalte
--   `anchor_entity` (welche Entität die Regel TRIFFT = entity_id + Aktions-Ziel) PLUS
--   `conditions` jsonb = { logic:'AND'|'OR', groups:[ { entity, where:<FilterNode> } ] }.
-- Jede group.where ist ein UNVERÄNDERTER Baum der bestehenden Filter-Lib (src/lib/filter) →
-- Single Source, keine zweite Bedingungssprache. Der Auswerter (L-2) wertet je Gruppe über
-- compileToPostgrest aus und verknüpft die Anker-ID-Mengen (AND=Schnitt / OR=Vereinigung).
--
-- VALIDIERUNGS-SPLIT (bewusst, dokumentiert):
--   * Server (dieser RPC) erzwingt: Rechte (automation.manage) · plan_limit · action.type ∈ aktive
--     Registry · GRAMMATIK der Option-B-Form (anchor/logic/groups/entity + Knoten-Form rule|group,
--     Operator ∈ Kanon). Grammatik ist in SQL abbildbar OHNE die Feld-Whitelist zu duplizieren.
--   * Feld-Whitelist je Typ (schema.ts) prüft die TS-Lib (validate.ts) am Schreib-Aufrufer (db.ts) UND
--     der L-2-Auswerter vor dem Kompilieren. Die INJECTION-GRENZE ist der Compiler (compileToPostgrest
--     emittiert nur Whitelist-Felder; unbekanntes Feld → Compiler lehnt ab, wird nie ausgeführt).

-- ── (1) lifecycle_rules ──────────────────────────────────────────────────────
create table lifecycle_rules (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  name             text not null,
  anchor_entity    text not null check (anchor_entity in ('contacts', 'companies', 'deals')),
  conditions       jsonb not null,                 -- { logic:'AND'|'OR', groups:[{entity, where}] }
  action           jsonb not null,                 -- { type:<action_types.key>, params:{...} }
  trigger_event    text not null default 'schedule'
                     check (trigger_event in ('schedule', 'contact_status_changed', 'score_updated', 'signal_created')),
  priority         int not null default 100,        -- Konflikt-Reihenfolge (datengetrieben, L-2)
  is_active        boolean not null default true,
  is_terminal      boolean not null default false,  -- reserviert: unterdrückt niedrigere Prio je Datensatz (L-2)
  created_by       uuid references users(id) on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ── (2) lifecycle_rule_runs — Match-Zustand für EINMAL-FEUER (Edge-Trigger) ───
-- Semantik (L-2): feuert, wenn ein Datensatz NEU matcht (matched false→true). Bleibt er matched,
-- passiert nichts mehr. Matcht er nicht mehr (true→false), wird er "scharf" für erneutes Feuern.
-- KEIN zeitbasiertes Wiederholen. `matched` = zuletzt ausgewerteter Zustand je (Regel, Datensatz).
create table lifecycle_rule_runs (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  rule_id           uuid not null references lifecycle_rules(id) on delete cascade,
  entity_id         uuid not null,                  -- die getroffene Anker-Entität (contact/deal/company id)
  matched           boolean not null default false, -- letzter ausgewerteter Match-Zustand
  fired_count       int not null default 0,
  last_evaluated_at timestamptz default now(),
  last_fired_at     timestamptz,
  action_result     jsonb,
  unique (rule_id, entity_id)                        -- EIN Zustand je (Regel, Datensatz)
);

-- ── (3) action_types — Aktions-Registry ALS DATEN (global, wie permission_catalog) ──
-- Produktweit identisch (nicht pro Org). Builder + Auswerter LESEN sie zur Laufzeit → kein
-- totes churn_rules-Muster. Gruppe-(2) scharfschalten = Zeile status='active' + Handler (L-2),
-- OHNE Regel-Schema/RPC/UI zu ändern. RLS: öffentlich lesbar, Write nur via Migration (service_role).
create table action_types (
  key           text primary key,                   -- notify | create_task | ...
  label_key     text not null,                       -- i18n-Key (de/en/es)
  status        text not null check (status in ('active', 'coming_soon')),
  requires      text,                                -- Vorbedingung-Hinweis für coming_soon
  params_schema jsonb,                               -- Params-Vertrag (UI-Rendering + Validierung, L-3)
  applies_to    text[] not null default array['contacts','companies','deals']
);

-- Seed: Gruppe (1) aktiv · Gruppe (2) coming_soon (ehrlich, Builder zeigt sie ausgegraut).
insert into action_types (key, label_key, status, requires, params_schema, applies_to) values
  ('notify',             'lifecycle.action.notify',             'active',      null,           '{"message":"required"}'::jsonb,               array['contacts','companies','deals']),
  ('notify_urgent',      'lifecycle.action.notify_urgent',      'active',      null,           '{"message":"required"}'::jsonb,               array['contacts','companies','deals']),
  ('create_task',        'lifecycle.action.create_task',        'active',      null,           '{"title":"required","due_in_days":"optional"}'::jsonb, array['contacts','deals']),
  ('add_tag',            'lifecycle.action.add_tag',            'active',      null,           '{"tag":"required"}'::jsonb,                   array['contacts','companies']),
  ('add_to_list',        'lifecycle.action.add_to_list',        'active',      null,           '{"list_id":"required"}'::jsonb,               array['contacts']),
  ('set_contact_status', 'lifecycle.action.set_contact_status', 'coming_soon', 'governance',   '{"status":"required"}'::jsonb,                array['contacts']),
  ('send_email_internal','lifecycle.action.send_email_internal','coming_soon', 'system_mail',  '{"subject":"required","body":"required"}'::jsonb, array['contacts','companies','deals']),
  ('send_email_contact', 'lifecycle.action.send_email_contact', 'coming_soon', 'ai_sdr_sending','{"subject":"required","body":"required"}'::jsonb, array['contacts']),
  ('start_sequence',     'lifecycle.action.start_sequence',     'coming_soon', 'ai_sdr',       '{"sequence_id":"required"}'::jsonb,           array['contacts']),
  ('slack_message',      'lifecycle.action.slack_message',      'coming_soon', 'slack',        '{"channel":"required","message":"required"}'::jsonb, array['contacts','companies','deals'])
on conflict (key) do update
  set label_key = excluded.label_key, status = excluded.status, requires = excluded.requires,
      params_schema = excluded.params_schema, applies_to = excluded.applies_to;

-- ── (4) plan_limits — Feature 'lifecycle_rules' (konfigurierbar je Plan) ──────
-- Interner Plan = unbegrenzt (-1). Zahlen je Kunden-Paket legt Oliver später fest (kein Hardcode).
insert into plan_limits (plan_id, feature, limit_value)
select '10000000-0000-0000-0000-000000000001', 'lifecycle_rules', -1
where not exists (
  select 1 from plan_limits
  where plan_id = '10000000-0000-0000-0000-000000000001' and feature = 'lifecycle_rules'
);

-- ── (5) RLS ──────────────────────────────────────────────────────────────────
-- lifecycle_rules/_runs: nur LESEN je Org (SELECT). Schreiben ausschließlich über die
-- security-definer-RPCs (bzw. Auswerter L-2 mit service_role) → EIN Schreibweg erzwungen.
alter table lifecycle_rules enable row level security;
create policy "lifecycle_rules_read" on lifecycle_rules for select using (organization_id = auth_org_id());

alter table lifecycle_rule_runs enable row level security;
create policy "lifecycle_rule_runs_read" on lifecycle_rule_runs for select using (organization_id = auth_org_id());

-- action_types: global, öffentlich lesbar (kein org_id — dokumentierte Ausnahme wie permission_catalog).
alter table action_types enable row level security;
create policy "action_types_public_read" on action_types for select using (true);

-- ── (6) Indizes ──────────────────────────────────────────────────────────────
create index idx_lifecycle_rules_org       on lifecycle_rules(organization_id, is_active);
create index idx_lifecycle_rules_created   on lifecycle_rules(created_at);
create index idx_lifecycle_rule_runs_rule  on lifecycle_rule_runs(rule_id, entity_id);
create index idx_lifecycle_rule_runs_org   on lifecycle_rule_runs(organization_id);

-- ── (7) audit-Trigger — jeder Regel-Write → audit_log ────────────────────────
create or replace function audit_lifecycle_rules()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (
    coalesce(new.organization_id, old.organization_id),
    auth.uid(),  -- Session-Claim bleibt über security-definer-Aufrufe erhalten
    case tg_op when 'INSERT' then 'lifecycle_rule_created'
               when 'UPDATE' then 'lifecycle_rule_updated'
               else 'lifecycle_rule_deleted' end,
    'lifecycle_rule',
    coalesce(new.id, old.id),
    jsonb_build_object('name', coalesce(new.name, old.name), 'op', tg_op)
  );
  return coalesce(new, old);
end;
$$;

create trigger trg_audit_lifecycle_rules
  after insert or update or delete on lifecycle_rules
  for each row execute function audit_lifecycle_rules();

-- ── (8) Validierungs-Helfer — Grammatik der Option-B-Form (KEINE Feld-Whitelist) ──
-- Prüft nur die STRUKTUR (rule|group, Operator-Kanon, anchor/entity/logic). Die Feld-Whitelist
-- je Typ macht die TS-Lib (validate.ts) am Aufrufer + der L-2-Auswerter (Injection-Grenze = Compiler).
create or replace function _lifecycle_validate_node(p_node jsonb)
returns void language plpgsql immutable as $$
declare v_child jsonb; v_op text;
begin
  if p_node is null or jsonb_typeof(p_node) <> 'object' then
    raise exception 'conditions: Knoten muss ein Objekt sein';
  end if;
  if p_node ? 'logic' then                                   -- Gruppe
    if (p_node->>'logic') not in ('AND', 'OR') then
      raise exception 'conditions: group.logic muss AND oder OR sein';
    end if;
    if jsonb_typeof(p_node->'rules') <> 'array' then
      raise exception 'conditions: group.rules muss ein Array sein';
    end if;
    for v_child in select value from jsonb_array_elements(p_node->'rules') loop
      perform _lifecycle_validate_node(v_child);
    end loop;
  elsif p_node ? 'field' then                                -- Regel
    if coalesce(p_node->>'field', '') = '' then
      raise exception 'conditions: rule.field fehlt';
    end if;
    v_op := p_node->>'operator';
    if v_op is null or v_op not in
      ('eq','neq','gt','gte','lt','lte','contains','starts_with','in','not_in','is_empty','is_not_empty','has_any') then
      raise exception 'conditions: unbekannter Operator %', coalesce(v_op, '(null)');
    end if;
  else
    raise exception 'conditions: Knoten ist weder Regel (field) noch Gruppe (logic)';
  end if;
end;
$$;

create or replace function _lifecycle_validate_conditions(p_conditions jsonb)
returns void language plpgsql immutable as $$
declare v_grp jsonb; v_entity text;
begin
  if p_conditions is null or jsonb_typeof(p_conditions) <> 'object' then
    raise exception 'conditions muss ein Objekt sein';
  end if;
  if (p_conditions->>'logic') not in ('AND', 'OR') then
    raise exception 'conditions.logic muss AND oder OR sein';
  end if;
  if jsonb_typeof(p_conditions->'groups') <> 'array' or jsonb_array_length(p_conditions->'groups') = 0 then
    raise exception 'conditions.groups muss ein nicht-leeres Array sein';
  end if;
  for v_grp in select value from jsonb_array_elements(p_conditions->'groups') loop
    v_entity := v_grp->>'entity';
    if v_entity is null or v_entity not in ('contacts', 'companies', 'deals') then
      raise exception 'conditions: group.entity ungueltig: %', coalesce(v_entity, '(null)');
    end if;
    if not (v_grp ? 'where') then
      raise exception 'conditions: group.where fehlt';
    end if;
    perform _lifecycle_validate_node(v_grp->'where');
  end loop;
end;
$$;

-- ── (9) EIN Schreibweg — upsert_lifecycle_rule (Mensch + KI-Chat) ─────────────
-- p_id null = Anlegen (Pflichtfelder streng + plan_limit) · p_id gesetzt = Patch-Merge auf Bestand.
create or replace function upsert_lifecycle_rule(p_id uuid, p_patch jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org uuid;
  v_ex lifecycle_rules%rowtype;
  v_name text; v_anchor text; v_conditions jsonb; v_action jsonb; v_action_type text;
  v_trigger text; v_priority int; v_is_active boolean; v_is_terminal boolean;
  v_limit int; v_count int; v_id uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  perform assert_permission('automation.manage');
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannte Organisation'; end if;

  if p_id is null then
    if not (p_patch ? 'name' and p_patch ? 'anchor_entity' and p_patch ? 'conditions' and p_patch ? 'action') then
      raise exception 'Pflichtfelder fehlen: name, anchor_entity, conditions, action';
    end if;
  else
    select * into v_ex from lifecycle_rules where id = p_id and organization_id = v_org;
    if not found then raise exception 'Regel nicht gefunden oder fremde Organisation'; end if;
  end if;

  -- Merge (Patch gewinnt, sonst Bestand, sonst Default).
  v_name        := coalesce(p_patch->>'name', v_ex.name);
  v_anchor      := coalesce(p_patch->>'anchor_entity', v_ex.anchor_entity);
  v_conditions  := coalesce(p_patch->'conditions', v_ex.conditions);
  v_action      := coalesce(p_patch->'action', v_ex.action);
  v_trigger     := coalesce(p_patch->>'trigger_event', v_ex.trigger_event, 'schedule');
  v_priority    := coalesce((p_patch->>'priority')::int, v_ex.priority, 100);
  v_is_active   := coalesce((p_patch->>'is_active')::boolean, v_ex.is_active, true);
  v_is_terminal := coalesce((p_patch->>'is_terminal')::boolean, v_ex.is_terminal, false);

  -- Validierung.
  if v_name is null or trim(v_name) = '' then raise exception 'name darf nicht leer sein'; end if;
  if v_anchor not in ('contacts', 'companies', 'deals') then raise exception 'anchor_entity ungueltig: %', v_anchor; end if;
  if v_trigger not in ('schedule', 'contact_status_changed', 'score_updated', 'signal_created') then
    raise exception 'trigger_event ungueltig: %', v_trigger;
  end if;
  perform _lifecycle_validate_conditions(v_conditions);
  v_action_type := v_action->>'type';
  if v_action_type is null then raise exception 'action.type fehlt'; end if;
  if not exists (select 1 from action_types where key = v_action_type and status = 'active') then
    raise exception 'Aktion nicht verfuegbar: % (unbekannt oder noch nicht freigeschaltet)', v_action_type;
  end if;

  -- plan_limit-Blocker (nur beim Anlegen; freundlicher RAISE, kein Silent-Fail).
  if p_id is null then
    select pl.limit_value into v_limit
    from organization_subscription os
    join plan_limits pl on pl.plan_id = os.plan_id and pl.feature = 'lifecycle_rules'
    where os.organization_id = v_org
    order by os.created_at desc
    limit 1;
    if v_limit is null then v_limit := -1; end if;
    if v_limit >= 0 then
      select count(*) into v_count from lifecycle_rules where organization_id = v_org;
      if v_count >= v_limit then
        raise exception 'Regel-Limit erreicht (% von %). Bitte upgraden oder eine bestehende Regel loeschen.', v_count, v_limit;
      end if;
    end if;
  end if;

  if p_id is null then
    insert into lifecycle_rules (organization_id, name, anchor_entity, conditions, action,
                                 trigger_event, priority, is_active, is_terminal, created_by)
    values (v_org, v_name, v_anchor, v_conditions, v_action,
            v_trigger, v_priority, v_is_active, v_is_terminal, v_actor)
    returning id into v_id;
  else
    update lifecycle_rules
      set name = v_name, anchor_entity = v_anchor, conditions = v_conditions, action = v_action,
          trigger_event = v_trigger, priority = v_priority, is_active = v_is_active,
          is_terminal = v_is_terminal, updated_at = now()
      where id = p_id and organization_id = v_org
      returning id into v_id;
  end if;
  return v_id;  -- audit via Trigger (INSERT/UPDATE)
end;
$$;

-- ── delete_lifecycle_rule ────────────────────────────────────────────────────
create or replace function delete_lifecycle_rule(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_actor uuid := auth.uid(); v_org uuid; v_deleted uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  perform assert_permission('automation.manage');
  select organization_id into v_org from users where id = v_actor;
  delete from lifecycle_rules where id = p_id and organization_id = v_org returning id into v_deleted;
  if v_deleted is null then raise exception 'Regel nicht gefunden oder fremde Organisation'; end if;
  -- audit via Trigger (DELETE)
end;
$$;
