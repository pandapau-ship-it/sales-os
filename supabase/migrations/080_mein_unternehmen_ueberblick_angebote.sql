-- 080_mein_unternehmen_ueberblick_angebote.sql
-- „Mein Unternehmen" SLICE 3a/2 — Überblick & Angebote (org_profile-Erweiterung).
-- Reiter „Überblick" (Zusammenfassung/Produktmodell/Nutzen/gelöste Probleme/Geschäftsergebnisse)
-- + „Angebot & Markt" (Angebots-Kärtchen + Wettbewerber direkt/angrenzend). ICPs/Personas = 3b.
--
-- ADDITIV (bereichsweite Regel): kein Umbau bestehender Slice-1-Spalten (usps/competitors bleiben),
-- alle inhaltlichen Felder OPTIONAL, `field_meta`-locked-Schutz wie 077.
--
-- MEHRSPRACHIGKEIT: Textfelder sind `jsonb` (heute reiner String, später {"de":…,"en":…}) — die
-- bereichsweite Regel „neue Textfelder immer jsonb, nie text" (077 hob products.description dafür
-- eigens von text auf jsonb). Betrifft summary/product_service_model/value_outcome und die Texte in
-- den Listen (problems_solved/business_outcomes/offerings). Lese-Helfer: src/lib/i18nText.ts.

-- ── org_profile additiv erweitern ───────────────────────────────────────────────────────────────
alter table org_profile add column if not exists summary               jsonb;              -- Kurzbeschreibung/Zusammenfassung
alter table org_profile add column if not exists product_service_model jsonb;              -- Produkt-/Service-Modell
alter table org_profile add column if not exists value_outcome         jsonb;              -- Nutzen / Ergebnis (Value)
-- Listen von Objekten mit stabiler id (die id trägt die Zuordnung beim Bearbeiten/Entfernen):
alter table org_profile add column if not exists problems_solved   jsonb not null default '[]';  -- [{id, text}] gelöste Probleme
alter table org_profile add column if not exists business_outcomes jsonb not null default '[]';  -- [{id, text}] Geschäftsergebnisse
alter table org_profile add column if not exists offerings         jsonb not null default '[]';  -- [{id, title, text}] Angebots-Kärtchen

-- ── competitors: von einfacher Liste auf direkt/angrenzend erweitern ─────────────────────────────
-- Bestehende Einträge NICHT verlieren: jeder Alt-Eintrag ohne `kind` bekommt `kind:'direct'`.
-- Neue Form: [{id, name, why_us, kind:'direct'|'adjacent'}].
update org_profile
set competitors = coalesce((
      select jsonb_agg(
        case when elem ? 'kind' then elem
             else elem || jsonb_build_object('kind', 'direct') end
        order by ord
      )
      from jsonb_array_elements(competitors) with ordinality as e(elem, ord)
    ), '[]'::jsonb)
where jsonb_typeof(competitors) = 'array' and jsonb_array_length(competitors) > 0;

-- ── update_org_profile(p_patch) — EINZIGER Schreibweg, erweitert (Muster + Garantien wie 077) ────
-- Rechte-Check (settings.manage) · Key-Whitelist (unbekannt → Fehler, kein stilles Schlucken) ·
-- field_meta[org.<feld>] = {source:manual, locked:true} pro berührtem Feld · audit_log.
create or replace function update_org_profile(p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_old   jsonb;
  v_meta  jsonb := '{}'::jsonb;
  k text;
  v_item jsonb;
  -- Skalar-Textfelder (jsonb-String, kein Struktur-Check) und Listen-Felder (Array von Objekten mit id).
  c_scalar text[] := array['summary','product_service_model','value_outcome'];
  c_list   text[] := array['usps','competitors','problems_solved','business_outcomes','offerings'];
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  -- Whitelist über beide Kategorien.
  for k in select jsonb_object_keys(p_patch) loop
    if not (k = any(c_scalar) or k = any(c_list)) then
      raise exception 'Unbekannter Unternehmensprofil-Key: %', k;
    end if;
  end loop;

  -- Listen-Felder: Array + jedes Element Objekt mit nicht-leerer id; competitors zusätzlich name + kind.
  foreach k in array c_list loop
    if p_patch ? k then
      if jsonb_typeof(p_patch->k) <> 'array' then raise exception '% muss eine Liste sein', k; end if;
      for v_item in select * from jsonb_array_elements(p_patch->k) loop
        if jsonb_typeof(v_item) <> 'object' or coalesce(v_item->>'id','') = '' then
          raise exception 'Jeder Eintrag in % braucht eine id', k;
        end if;
        if k = 'competitors' then
          if length(trim(coalesce(v_item->>'name',''))) = 0 then
            raise exception 'Wettbewerber braucht einen Namen';
          end if;
          if v_item ? 'kind' and (v_item->>'kind') not in ('direct','adjacent') then
            raise exception 'Wettbewerber-kind muss direct oder adjacent sein';
          end if;
        end if;
      end loop;
      v_meta := v_meta || jsonb_build_object('org.'||k,
        jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
    end if;
  end loop;

  -- Skalar-Textfelder: nur field_meta locken (kein Struktur-Check, jsonb-String).
  foreach k in array c_scalar loop
    if p_patch ? k then
      v_meta := v_meta || jsonb_build_object('org.'||k,
        jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
    end if;
  end loop;

  -- Zeile bei Bedarf anlegen (die Org hat nicht zwingend schon ein Profil).
  insert into org_profile (organization_id) values (v_org) on conflict (organization_id) do nothing;

  -- Alt-Werte fürs Audit (ganze inhaltliche Zeile ohne technische Spalten).
  select to_jsonb(op) - 'id' - 'organization_id' - 'field_meta' - 'created_at' - 'updated_at'
    into v_old from org_profile op where organization_id = v_org;

  update org_profile set
    usps                  = case when p_patch ? 'usps'                  then p_patch->'usps'                  else usps end,
    competitors           = case when p_patch ? 'competitors'           then p_patch->'competitors'           else competitors end,
    problems_solved       = case when p_patch ? 'problems_solved'       then p_patch->'problems_solved'       else problems_solved end,
    business_outcomes     = case when p_patch ? 'business_outcomes'     then p_patch->'business_outcomes'     else business_outcomes end,
    offerings             = case when p_patch ? 'offerings'             then p_patch->'offerings'             else offerings end,
    summary               = case when p_patch ? 'summary'               then p_patch->'summary'               else summary end,
    product_service_model = case when p_patch ? 'product_service_model' then p_patch->'product_service_model' else product_service_model end,
    value_outcome         = case when p_patch ? 'value_outcome'         then p_patch->'value_outcome'         else value_outcome end,
    field_meta            = coalesce(field_meta,'{}'::jsonb) || v_meta
  where organization_id = v_org;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_org_profile', 'org_profile', v_org,
          jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;
