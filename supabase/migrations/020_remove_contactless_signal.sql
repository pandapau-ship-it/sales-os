-- 020_remove_contactless_signal.sql
-- Aufräumen: das kontaktlose Test-Signal (Nr. 5) aus 019 entfernen. Der Fall
-- „Signal ohne Kontakt" existiert real nicht (zu jedem Signal wird ein Kontakt
-- automatisch angelegt). 019 ist appliziert → nicht editieren, hier additiv löschen.
-- Idempotent: DELETE per fester id (mehrfach ausführbar, kein Fehler wenn schon weg).

delete from signals where id = '55555555-5555-5555-5555-000000000005';
