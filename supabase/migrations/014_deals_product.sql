-- 014_deals_product.sql
-- deals.product — welches Produkt dieser einzelne Deal betrifft.
-- CLAUDE.md verlangt deals.name UND deals.product; `name` ist seit 004 da,
-- nur `product` fehlte. Maßgeblich: CLAUDE.md → Deal-Felder name/product.
--
-- Scope: NUR das Feld am Deal. Der Produkt-KATALOG (Starter/Growth/Scale/…)
-- ist eine eigene `products`-Tabelle (kommt später beim Pipeline-Wiring),
-- NICHT system_config/settings.
--
-- Additiv auf bereits appliziertem 004 (kein reset, kein Eingriff in 001–013).
-- Nullable, kein Default: Bestands-Deals haben kein Produkt → NULL = "keins
-- zugeordnet". NOT NULL würde den ALTER auf vorhandenen Rows brechen; ein Default
-- würde allen Deals fälschlich ein Produkt zuweisen (soll pro Deal explizit sein).
-- Kein neuer Trigger nötig: deals trägt updated_at- + audit_write-Trigger aus 010,
-- die spaltenunabhängig feuern und die neue Spalte automatisch erfassen.

alter table deals add column product text;
