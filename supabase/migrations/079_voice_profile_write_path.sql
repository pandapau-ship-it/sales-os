-- 079_voice_profile_write_path.sql
-- „Mein Unternehmen" SLICE 2/3 — Personal Voice: EINZIGER validierter Schreibweg.
-- Muster wie update_my_profile (073, Self-Service) + update_org_profile (077, field_meta-locked):
--   • Self-Service, KEIN settings.manage — die eigene Voice (visibility:'self'). Jedes Mitglied
--     pflegt ausschließlich die EIGENE Zeile.
--   • security definer → RLS greift INNEN nicht; darum unten explizit auf (user_id, org) scopen
--     und Cross-User/Cross-Org strukturell ausschließen.
--   • Key-/Sub-Key-Whitelist: unbekannte Felder → Fehler, kein stilles Schlucken (Tippfehler-Falle).
--   • field_meta[voice.<kanal>.<feld>] = {source:manual, locked:true} pro BERÜHRTEM Feld — der
--     Schutz vor dem späteren Content-Scan / „AI Voice Trainer": was der Mensch angefasst hat,
--     darf ein Auto-Befüller nie überschreiben.
--   • Kanäle SHALLOW mergen — nur die gelieferten Sub-Felder werden gesetzt, der Rest des Kanals
--     bleibt. Damit ist „save on blur pro Feld" (KnowledgeField) rennsicher: ein Feld zu speichern
--     löscht nie die Nachbarfelder desselben Kanals.
--
-- Feld-Pfade (stabil, wie in 078 eingefroren):
--   voice.overview.{bio,themes,style,tone}
--   voice.{post,comment,dm,email}.{samples,sentence_style,hooks,dos_donts}
--   voice.primary_channel

create or replace function update_voice_profile(p_patch jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_actor   uuid := auth.uid();
  v_org     uuid;
  v_old     jsonb;
  v_meta    jsonb := '{}'::jsonb;
  k         text;        -- Top-Level-Key (Kanal oder primary_channel)
  sk        text;        -- Sub-Key innerhalb eines Kanals
  v_chan    jsonb;       -- Patch-Wert eines Kanals
  v_allowed text[];      -- erlaubte Sub-Keys je Kanal
  v_pc      text := p_patch->>'primary_channel';
begin
  if v_actor is null then raise exception 'nicht authentifiziert'; end if;
  select organization_id into v_org from users where id = v_actor;
  if v_org is null then raise exception 'unbekannter User'; end if;

  -- Top-Level-Keys whitelisten.
  for k in select jsonb_object_keys(p_patch) loop
    if k not in ('overview','post','comment','dm','email','primary_channel') then
      raise exception 'Unbekannter Voice-Key: %', k;
    end if;
  end loop;

  -- Kanal-Objekte prüfen (Objekt + erlaubte Sub-Keys) und field_meta pro berührtem Feld locken.
  for k in select jsonb_object_keys(p_patch) loop
    continue when k = 'primary_channel';
    v_chan := p_patch->k;
    if jsonb_typeof(v_chan) <> 'object' then raise exception 'Kanal % muss ein Objekt sein', k; end if;
    if k = 'overview' then v_allowed := array['bio','themes','style','tone'];
    else                   v_allowed := array['samples','sentence_style','hooks','dos_donts'];
    end if;
    for sk in select jsonb_object_keys(v_chan) loop
      if not (sk = any(v_allowed)) then raise exception 'Unbekanntes Voice-Feld: %.%', k, sk; end if;
      v_meta := v_meta || jsonb_build_object('voice.'||k||'.'||sk,
        jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
    end loop;
  end loop;

  -- primary_channel validieren (der CHECK in 078 deckt es zusätzlich ab — hier klare Meldung).
  if p_patch ? 'primary_channel' then
    if v_pc not in ('post','comment','dm','email') then raise exception 'Ungueltiger primary_channel'; end if;
    v_meta := v_meta || jsonb_build_object('voice.primary_channel',
      jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
  end if;

  -- Zeile sicherstellen (der User hat nicht zwingend schon eine Voice-Zeile).
  insert into voice_profiles (organization_id, user_id) values (v_org, v_actor)
    on conflict (organization_id, user_id) do nothing;

  select jsonb_build_object('overview', overview, 'post', post, 'comment', comment,
                            'dm', dm, 'email', email, 'primary_channel', primary_channel)
    into v_old from voice_profiles where user_id = v_actor and organization_id = v_org;

  update voice_profiles set
    overview = case when p_patch ? 'overview' then coalesce(overview,'{}'::jsonb) || (p_patch->'overview') else overview end,
    post     = case when p_patch ? 'post'     then coalesce(post,'{}'::jsonb)     || (p_patch->'post')     else post end,
    comment  = case when p_patch ? 'comment'  then coalesce(comment,'{}'::jsonb)  || (p_patch->'comment')  else comment end,
    dm       = case when p_patch ? 'dm'       then coalesce(dm,'{}'::jsonb)       || (p_patch->'dm')       else dm end,
    email    = case when p_patch ? 'email'    then coalesce(email,'{}'::jsonb)    || (p_patch->'email')    else email end,
    primary_channel = case when p_patch ? 'primary_channel' then v_pc else primary_channel end,
    field_meta = coalesce(field_meta,'{}'::jsonb) || v_meta
  where user_id = v_actor and organization_id = v_org;

  insert into audit_log (organization_id, user_id, action, entity_type, entity_id, metadata)
  values (v_org, v_actor, 'update_voice_profile', 'voice_profile', v_actor,
          jsonb_build_object('patch', p_patch, 'old', v_old));
end;
$$;
