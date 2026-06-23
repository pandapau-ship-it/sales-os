-- 044_knowledge_base_team.sql
-- knowledge_base-Eintrag dieser Session: Team & Einladungen ([D21] Scheibe 7).
-- Muster wie 015/016/038/040: idempotent über UNIQUE(org,feature) + ON CONFLICT DO UPDATE.

insert into knowledge_base (organization_id, feature, what, how, value, module) values

  ('00000000-0000-0000-0000-000000000001',
   'Team & Einladungen',
   'Mitglieder der Organisation verwalten: Liste aller Mitglieder (Name/E-Mail/Rolle/Seit), Rollen ändern (nur Owner), neue Personen per E-Mail einladen (Owner/Admin) und offene Einladungen zurückziehen. Beim Registrieren über eine Einladung wird die Person automatisch der richtigen Organisation mit der eingeladenen Rolle zugeordnet (kein manuelles Setup). Hinweis: Der eigentliche Einladungs-Mailversand folgt (kommt als serverseitige Funktion); die Einladung ist bereits gespeichert.',
   'Einstellungen → Team → „Mitglied einladen" (E-Mail + Rolle wählen). Rollen direkt in der Mitgliederliste per Dropdown ändern; offene Einladungen mit „Zurückziehen" entfernen.',
   'Schnelles Team-Onboarding ohne IT: neue Kolleg:innen sind in Minuten startklar, Rollen steuern Zugriff sauber, und gegenseitige Vertretung sorgt dafür, dass kein Lead liegen bleibt, wenn jemand ausfällt.',
   'core')

on conflict (organization_id, feature) do update set
  what = excluded.what, how = excluded.how, value = excluded.value, module = excluded.module;
