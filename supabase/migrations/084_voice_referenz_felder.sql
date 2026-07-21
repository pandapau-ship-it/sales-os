-- 084_voice_referenz_felder.sql
-- Personal Voice an das Referenz-Design angleichen — Felder je Kanal GETRENNT statt Sammel-Feld.
-- NUR der Schreibweg (update_voice_profile) wird angepasst: KEIN ALTER TABLE, KEINE Daten-Änderung.
-- Die Kanäle sind jsonb; neue Keys leben in den bestehenden Objekten (overview/post/comment/dm/email).
--
-- KEIN DATENVERLUST (bestätigt): Die alten Keys `sentence_style`/`hooks` (Kanäle) und `themes` (Overview)
-- werden NICHT gelöscht — sie bleiben in der Whitelist UND im gespeicherten jsonb erhalten, bis die neuen
-- Felder befüllt sind. Der shallow-Merge (||) überschreibt nie Nachbar-Keys. Grund für „alte Keys in der
-- Whitelist lassen": die heutige UI schreibt noch die alten Keys — ohne sie würde sie bis zum UI-Update
-- fehlschlagen (die UI-Umstellung + Daten-Neueingabe der getrennten Inhalte folgen in den nächsten Slices).
--
-- REFERENZ-VERIFIZIERT (00_Designs/…/PersonalVoiceCard): 4 Reiter Overview/Post/Comment/DM (KEIN E-Mail —
-- unsere 5. Ergänzung, hier DM-analog gebaut). Feld-Typen: Tonfall/Wortwahl/Hook-Strategien/Kernthemen = LISTE,
-- Satzbau/Emoji&Format/Engagement-Muster/CTA-Stil/Verkaufsansatz(style) = TEXT. sales_approach bleibt EIN
-- Textfeld = das bestehende `style` (Oliver-Entscheidung: KI braucht den Zusammenhang) — kein neuer Key.
--
-- NEUE Keys je Kanal:
--   overview: core_topics (Liste)                      [style/bio/tone bleiben; altes themes bleibt]
--   post:     tone_attributes(L)·sentence_structure·vocabulary(L)·emoji_formatting·hook_strategies(L)
--   comment:  …·engagement_patterns (statt hooks)
--   dm/email: …·cta_style (statt hooks)

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
  v_item    jsonb;       -- Listen-Eintrag (für die Listen-Felder)
  v_allowed text[];      -- erlaubte Sub-Keys je Kanal
  v_pc      text := p_patch->>'primary_channel';
  -- Gemeinsame Sub-Keys aller Nachrichten-Kanäle (post/comment/dm/email): alt (sentence_style/hooks) +
  -- neu (getrennte Felder). Kanal-spezifisch kommt hook_strategies/engagement_patterns/cta_style dazu.
  c_chan_common text[] := array['samples','dos_donts','sentence_style','hooks',
                                'tone_attributes','sentence_structure','vocabulary','emoji_formatting'];
  -- Listen-Felder ([{id,text}]): müssen Array sein, jedes Item mit id.
  c_list_keys text[] := array['core_topics','tone_attributes','vocabulary','hook_strategies'];
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

  -- Kanal-Objekte prüfen (Objekt + erlaubte Sub-Keys je Kanal) und field_meta pro berührtem Feld locken.
  for k in select jsonb_object_keys(p_patch) loop
    continue when k = 'primary_channel';
    v_chan := p_patch->k;
    if jsonb_typeof(v_chan) <> 'object' then raise exception 'Kanal % muss ein Objekt sein', k; end if;

    -- Erlaubte Sub-Keys je Kanal (Referenz: unterschiedliche Kanal-spezifische Felder).
    if    k = 'overview' then v_allowed := array['bio','tone','style','themes','core_topics'];
    elsif k = 'post'     then v_allowed := c_chan_common || array['hook_strategies'];
    elsif k = 'comment'  then v_allowed := c_chan_common || array['engagement_patterns'];
    else                      v_allowed := c_chan_common || array['cta_style']; -- dm + email (DM-analog)
    end if;

    for sk in select jsonb_object_keys(v_chan) loop
      if not (sk = any(v_allowed)) then raise exception 'Unbekanntes Voice-Feld: %.%', k, sk; end if;
      -- Listen-Felder validieren: Array + jedes Item hat id.
      if sk = any(c_list_keys) then
        if jsonb_typeof(v_chan->sk) <> 'array' then raise exception 'Voice-Feld %.% muss eine Liste sein', k, sk; end if;
        for v_item in select * from jsonb_array_elements(v_chan->sk) loop
          if not (v_item ? 'id') then raise exception 'Listen-Eintrag in %.% ohne id', k, sk; end if;
        end loop;
      end if;
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

  -- Shallow-Merge je Kanal (überschreibt nie Nachbar-Keys → alte Felder bleiben erhalten).
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
