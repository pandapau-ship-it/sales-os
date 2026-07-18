-- 060_contacts_city_country — [D-contact-city] aufgelöst.
--
-- Die CRM-Felder-Doku (docs/sales_os_crm_felder.md) sieht Standort/Stadt + Land für Kontakte vor,
-- die contacts-Tabelle hatte diese Spalten aber nicht. Folgen ohne die Spalten: Import-Mapping
-- „Stadt/Land" schlägt beim Insert fehl, und der Details-Tab (Hunter + Farmer, via seedContactDetails)
-- kann Standort/Land nicht anzeigen/speichern.
--
-- Der Code ist bereits vollständig verdrahtet (createContact schreibt city/country, DETAIL_MAP
-- mappt stadt→city / land→country, Import-Synonyme city/country, getContactDetail select("*")).
-- Es fehlten NUR die Spalten. Rein additiv/low-risk: zwei neue nullable text-Spalten, keine
-- bestehenden Daten/Spalten betroffen. RLS/org_isolation/CASCADE gelten unverändert (Spalten
-- auf der bestehenden, bereits geschützten Tabelle).

alter table contacts add column if not exists city    text;
alter table contacts add column if not exists country text;
