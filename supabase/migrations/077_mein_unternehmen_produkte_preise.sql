-- 077_mein_unternehmen_produkte_preise.sql
-- „Mein Unternehmen" SLICE 1/3 — Produkte & Preise (Bauplan 8.B [SET-KB-1] / [SET-KB-2]).
-- Etabliert das GRUNDMUSTER für Slice 2 (Personal Voice) und Slice 3 (Unternehmensprofil):
-- schlanke org_profile-Zeile · field_meta mit locked · genau EIN validierter Schreibweg je Objekt.
--
-- BEREICHSWEITE REGEL (gilt auch für Slice 2+3): ALLE inhaltlichen Felder sind OPTIONAL.
-- Pflicht sind ausschließlich die technischen Spalten (id, organization_id). Der Nutzer füllt
-- in seinem Tempo; leere Felder zeigt die UI ehrlich leer, nie erzwungen.
--
-- MEHRSPRACHIGKEIT (Entscheidung 5) — Andock-Haken ohne Komplexität heute: alle Textfelder, die
-- später je Sprache abweichen könnten, sind `jsonb`. Ein jsonb-Wert darf ein REINER STRING sein
-- ("Hilft Teams …") — genau das schreibt die UI heute. Später kann derselbe Wert ohne Migration
-- zu {"de":"…","en":"…"} werden; ein Lese-Helfer (src/lib/i18nText.ts) versteht beide Formen.
-- Deshalb wird products.description hier von text auf jsonb gehoben (verlustfrei, to_jsonb).

-- ── org_profile — Firmen-Ebene, EINE Zeile pro Org. Hier NUR was Slice 1 braucht. ───────────────
-- Slice 3 (Unternehmensprofil/ICP/Personas) erweitert diese Tabelle ADDITIV — kein Umbau,
-- keine zweite Tabelle. Wettbewerber + USPs leben hier (Entscheidung 2, Single Source):
-- die Seite „Produkte & Preise" ZEIGT sie, hält sie aber nicht doppelt.
create table if not exists org_profile (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null unique references organizations(id) on delete cascade,
  -- [{ "id": "<slug>", "text": <jsonb-Text> }] — mehrere USPs als wachsende Liste.
  usps             jsonb not null default '[]',
  -- [{ "id": "<slug>", "name": "HubSpot", "why_us": <jsonb-Text> }] — mehrere Wettbewerber.
  competitors      jsonb not null default '[]',
  -- Feldpfad → {source: manual|crawl|sherloq|ai, updated_at, confidence, locked}.
  -- `locked` ist der Schutz gegen den SPÄTEREN Website-Scan: was der Mensch angefasst hat,
  -- darf ein Re-Crawl nie überschreiben. Muss JETZT existieren, sonst zerstört der erste
  -- Scan-Lauf gepflegte Inhalte unwiederbringlich. Rein intern — kein UI-Element.
  field_meta       jsonb not null default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table org_profile enable row level security;
drop policy if exists "org_profile_tenant_isolation" on org_profile;
create policy "org_profile_tenant_isolation" on org_profile
  using (organization_id = auth_org_id());

create index if not exists idx_org_profile_org on org_profile(organization_id);
drop trigger if exists trg_org_profile_updated_at on org_profile;
create trigger trg_org_profile_updated_at before update on org_profile
  for each row execute function update_updated_at();
drop trigger if exists trg_org_profile_audit on org_profile;
create trigger trg_org_profile_audit after insert or update or delete on org_profile
  for each row execute function audit_write();

-- ── products (028) ADDITIV erweitern — KEINE zweite product_info-Tabelle (Entscheidung 1) ───────
-- Begründung: `products` ist bereits in Benutzung (getProducts speist das Deal-Produkt-Dropdown).
-- Zwei Produkt-Tabellen hieße: der Nutzer legt hier ein Produkt an und findet es im Deal nicht.
-- Es ist dasselbe Objekt in zwei Rollen (Auswahlliste beim Deal · AI-Kontext beim Texten).
alter table products add column if not exists benefit  jsonb;   -- Hauptnutzen — was löst es?
alter table products add column if not exists audience jsonb;   -- Zielgruppe — für wen ist es?
alter table products add column if not exists price    text;    -- Freitext („149€", „auf Anfrage")
alter table products add column if not exists price_model text; -- per_seat | monthly | one_time

-- description: text → jsonb (locale-fähig, siehe Kopf). Verlustfrei; heute liest nur
-- getProducts(id,name) diese Tabelle, also keine Leseseite betroffen.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_name = 'products' and column_name = 'description' and data_type <> 'jsonb'
  ) then
    alter table products alter column description type jsonb using to_jsonb(description);
  end if;
end $$;

-- PREIS-FREIGABE — pro EINZELNEM Produkt, sicherer Standard AUS.
-- Solange false, darf eine KI-Textgenerierung den Preis dieses Produkts NIEMALS in einer
-- generierten Nachricht nennen oder umschreiben — auch dann nicht, wenn `price` gefüllt ist.
-- Harte Bedingung für den künftigen Nachrichten-Baustein (docs/ai_sdr_bauplan_v1.md).
alter table products add column if not exists ai_may_reference_price boolean not null default false;

-- ── FELDPFADE (kanonisch, ab jetzt STABIL — dürfen nie umbenannt werden) ────────────────────────
-- Sie adressieren jedes Feld eindeutig für field_meta, den KI-Knopf und den späteren AI-Chat
-- („setze bei Produkt X die Preisfreigabe auf an" → derselbe Weg wie ein Klick auf den Stift):
--   org.usps
--   org.competitors
--   product.<id>.name · .description · .benefit · .audience · .price · .price_model
--   product.<id>.ai_may_reference_price
-- Slice 2/3 setzen das Muster fort (voice.<channel>.<feld> · icp.<id>.<feld> · persona.<id>.<feld>).

-- ── update_org_profile(p_patch) — EINZIGER Schreibweg auf org_profile ───────────────────────────
-- Muster wie update_general_settings (073): Key-Whitelist, Rechte-Check, audit_log.
-- Setzt zusätzlich field_meta[pfad] = {source:'manual', locked:true} — der Schutz aus Teil A.
create or replace function update_org_profile(p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_old   jsonb;
  v_meta  jsonb := '{}'::jsonb;
  k text;
  v_item jsonb;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  -- Unbekannte Keys → Fehler, kein stilles Schlucken (Falle: Tippfehler verschwindet lautlos).
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('usps','competitors') then
      raise exception 'Unbekannter Unternehmensprofil-Key: %', k;
    end if;
  end loop;

  -- Form prüfen: beides Arrays von Objekten mit stabiler id (die id trägt die Zuordnung
  -- beim Bearbeiten/Entfernen — ohne sie kollabiert die Liste bei gleichlautenden Einträgen).
  if p_patch ? 'usps' then
    if jsonb_typeof(p_patch->'usps') <> 'array' then raise exception 'usps muss eine Liste sein'; end if;
    for v_item in select * from jsonb_array_elements(p_patch->'usps') loop
      if jsonb_typeof(v_item) <> 'object' or coalesce(v_item->>'id','') = '' then
        raise exception 'Jeder USP braucht eine id';
      end if;
    end loop;
    v_meta := v_meta || jsonb_build_object('org.usps',
      jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
  end if;

  if p_patch ? 'competitors' then
    if jsonb_typeof(p_patch->'competitors') <> 'array' then raise exception 'competitors muss eine Liste sein'; end if;
    for v_item in select * from jsonb_array_elements(p_patch->'competitors') loop
      if jsonb_typeof(v_item) <> 'object' or coalesce(v_item->>'id','') = '' then
        raise exception 'Jeder Wettbewerber braucht eine id';
      end if;
      if length(trim(coalesce(v_item->>'name',''))) = 0 then
        raise exception 'Wettbewerber braucht einen Namen';
      end if;
    end loop;
    v_meta := v_meta || jsonb_build_object('org.competitors',
      jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
  end if;

  -- Zeile bei Bedarf anlegen (die Org hat nicht zwingend schon ein Profil).
  insert into org_profile (organization_id) values (v_org) on conflict (organization_id) do nothing;

  select jsonb_build_object('usps', usps, 'competitors', competitors)
    into v_old from org_profile where organization_id = v_org;

  update org_profile set
    usps        = case when p_patch ? 'usps'        then p_patch->'usps'        else usps end,
    competitors = case when p_patch ? 'competitors' then p_patch->'competitors' else competitors end,
    field_meta  = coalesce(field_meta,'{}'::jsonb) || v_meta
  where organization_id = v_org;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_org_profile', 'org_profile', v_org,
          jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;

-- ── create_product() — legt ein leeres Produkt an (alle Inhalte optional) ───────────────────────
create or replace function create_product()
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_id    uuid;
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  -- name ist in 028 NOT NULL → leerer String statt Zwang zu einem Namen (bereichsweite Regel:
  -- nichts inhaltlich Pflicht). Die UI zeigt ihn als leeres Feld mit Platzhalter.
  insert into products (organization_id, name) values (v_org, '') returning id into v_id;
  return v_id;
end;
$$;

-- ── update_product(p_id, p_patch) — EINZIGER Schreibweg auf ein Produkt ─────────────────────────
create or replace function update_product(p_id uuid, p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  v_org   uuid;
  v_prod_org uuid;
  v_old   jsonb;
  k text;
  v_pm text := p_patch->>'price_model';
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;
  if not has_permission(v_actor, 'settings.manage') then raise exception 'Kein Recht (settings.manage)'; end if;

  -- Cross-Org: nie ein fremdes Produkt anfassen (RLS greift bei security definer NICHT).
  select organization_id into v_prod_org from products where id = p_id;
  if v_prod_org is null then raise exception 'Produkt nicht gefunden'; end if;
  if v_prod_org <> v_org then raise exception 'Produkt gehoert zu einer anderen Organisation'; end if;

  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('name','description','benefit','audience','price','price_model',
                 'ai_may_reference_price','is_active') then
      raise exception 'Unbekannter Produkt-Key: %', k;
    end if;
  end loop;

  -- Bewusst KEINE Leer-Prüfung auf Inhalte: alles darf leer bleiben.
  if p_patch ? 'name'  and length(coalesce(p_patch->>'name','')) > 200 then raise exception 'Produktname zu lang'; end if;
  if p_patch ? 'price' and length(coalesce(p_patch->>'price','')) > 100 then raise exception 'Preis zu lang'; end if;
  if v_pm is not null and v_pm <> '' and v_pm not in ('per_seat','monthly','one_time') then
    raise exception 'Ungueltiges Preis-Modell';
  end if;
  if p_patch ? 'ai_may_reference_price'
     and jsonb_typeof(p_patch->'ai_may_reference_price') <> 'boolean' then
    raise exception 'Preisfreigabe muss ja/nein sein';
  end if;

  select jsonb_build_object('name', name, 'description', description, 'benefit', benefit,
                            'audience', audience, 'price', price, 'price_model', price_model,
                            'ai_may_reference_price', ai_may_reference_price, 'is_active', is_active)
    into v_old from products where id = p_id;

  update products set
    name        = case when p_patch ? 'name'        then coalesce(p_patch->>'name','') else name end,
    description = case when p_patch ? 'description' then p_patch->'description'        else description end,
    benefit     = case when p_patch ? 'benefit'     then p_patch->'benefit'            else benefit end,
    audience    = case when p_patch ? 'audience'    then p_patch->'audience'           else audience end,
    price       = case when p_patch ? 'price'       then nullif(p_patch->>'price','')  else price end,
    price_model = case when p_patch ? 'price_model' then nullif(v_pm,'')               else price_model end,
    ai_may_reference_price = case when p_patch ? 'ai_may_reference_price'
                                  then (p_patch->>'ai_may_reference_price')::boolean
                                  else ai_may_reference_price end,
    is_active   = case when p_patch ? 'is_active'   then (p_patch->>'is_active')::boolean else is_active end,
    updated_at  = now()
  where id = p_id;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_product', 'product', p_id,
          jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;

-- ── delete_product(p_id) — WEICH (is_active=false), wie „Entfernen" bei Mitgliedern (076) ───────
-- Hart löschen wäre riskant: deals.product hält den Produktnamen als Text; ein hart gelöschtes
-- Produkt ließe alte Deals ohne Bezug zurück.
create or replace function delete_product(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform update_product(p_id, jsonb_build_object('is_active', false));
end;
$$;
