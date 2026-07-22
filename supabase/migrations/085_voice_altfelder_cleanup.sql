-- 085_voice_altfelder_cleanup.sql
-- [D-voice-altfelder-cleanup] — die alten Voice-Sammel-Keys endgültig entfernen.
-- Voraussetzung erfüllt: die neuen Split-Felder sind befüllt und live bestätigt (Slice „Daten-Neueingabe"),
-- die alten Keys `sentence_style`/`hooks` (je Kanal) + `themes` (overview) sind damit redundant.
-- Sicherheits-Check zuvor: KEIN aktiver Code liest/schreibt die alten Keys (nur die Whitelist-Erlaubnis
-- hier + reine TS-Typen + tote i18n-Keys, die im selben Slice mitentfernt werden).
--
-- Zwei Teile: (A) update_voice_profile ohne die alten Keys in der Whitelist neu definieren,
-- (B) die alten Keys aus der/den voice_profiles-Zeile(n) + field_meta entfernen (idempotent; `-` auf
-- einen nicht existierenden Key ist ein No-op). KEIN ALTER TABLE (die Kanäle bleiben jsonb).

-- ── (A) Schreibweg neu: alte Keys NICHT mehr erlaubt ────────────────────────────────
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
  -- Gemeinsame Sub-Keys aller Nachrichten-Kanäle (post/comment/dm/email) — OHNE die alten
  -- Sammel-Keys sentence_style/hooks (in 085 entfernt). Kanal-spezifisch kommt hook_strategies/
  -- engagement_patterns/cta_style dazu.
  c_chan_common text[] := array['samples','dos_donts',
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

    -- Erlaubte Sub-Keys je Kanal (OHNE alte Keys: kein `themes`, kein `sentence_style`/`hooks`).
    if    k = 'overview' then v_allowed := array['bio','tone','style','core_topics'];
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

  -- primary_channel validieren.
  if p_patch ? 'primary_channel' then
    if v_pc not in ('post','comment','dm','email') then raise exception 'Ungueltiger primary_channel'; end if;
    v_meta := v_meta || jsonb_build_object('voice.primary_channel',
      jsonb_build_object('source','manual','updated_at', now(), 'locked', true));
  end if;

  -- Zeile sicherstellen.
  insert into voice_profiles (organization_id, user_id) values (v_org, v_actor)
    on conflict (organization_id, user_id) do nothing;

  select jsonb_build_object('overview', overview, 'post', post, 'comment', comment,
                            'dm', dm, 'email', email, 'primary_channel', primary_channel)
    into v_old from voice_profiles where user_id = v_actor and organization_id = v_org;

  -- Shallow-Merge je Kanal.
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

-- ── (B) Redundante Alt-Keys aus den Daten + field_meta entfernen (alle Zeilen; idempotent) ──────────
-- `-` entfernt einen Objekt-Key; auf einen nicht vorhandenen Key ist es ein No-op. Nur die alten Keys
-- werden angefasst — neue Split-Keys + dos_donts/samples/bio/tone/style bleiben unverändert.
update voice_profiles set
  overview = overview - 'themes',
  post     = post    - 'sentence_style' - 'hooks',
  comment  = comment - 'sentence_style' - 'hooks',
  dm       = dm      - 'sentence_style' - 'hooks',
  email    = email   - 'sentence_style' - 'hooks',
  field_meta = field_meta
    - 'voice.overview.themes'
    - 'voice.post.sentence_style'    - 'voice.post.hooks'
    - 'voice.comment.sentence_style' - 'voice.comment.hooks'
    - 'voice.dm.sentence_style'      - 'voice.dm.hooks'
    - 'voice.email.sentence_style'   - 'voice.email.hooks'
where overview ? 'themes'
   or post    ?| array['sentence_style','hooks']
   or comment ?| array['sentence_style','hooks']
   or dm      ?| array['sentence_style','hooks']
   or email   ?| array['sentence_style','hooks']
   or field_meta ?| array['voice.overview.themes',
        'voice.post.sentence_style','voice.post.hooks',
        'voice.comment.sentence_style','voice.comment.hooks',
        'voice.dm.sentence_style','voice.dm.hooks',
        'voice.email.sentence_style','voice.email.hooks'];
