# AI-Studio-Design-Prompt — K-6 „Duplikate verwalten" + Merge-Dialog

> Für Oliver zum Einfügen in AI Studio. Danach: Mocks raus, in Library-Komponenten übersetzen
> (DataTableCard-Muster, DetailField, shadcn-Dialog), alle Farben/Radien auf CSS-Tokens.
> Design liefert Layout + Zustände, nicht die Werte.

## Kontext
B2B-Sales-CRM (ruhig, „calm · intelligent", Deep-Teal `#185557`, Plus Jakarta Sans, hellgrauer BG,
weiße Karten, weiche Schatten). Es gibt eine Kontakte- und eine Companies-Tabelle. Jetzt fehlt der
**„Duplikate verwalten"-Screen** (Zugang: Kontakte → Aktionen → „Duplikate verwalten") und der
**Merge-Dialog**.

## Screen „Duplikate verwalten" (eigene Seite/Route)
- Kopf: Titel „Duplikate verwalten" + Untertext „X mögliche Doppel-Einträge gefunden". Umschalter
  **Kontakte | Companies** (zwei Entitäten, gleiche Mechanik).
- **Liste von Paaren** (nicht Einzelzeilen): jede Karte/Zeile zeigt **zwei Datensätze nebeneinander**
  (links Kandidat A, rechts Kandidat B), je mit Avatar, Name, Firma, E-Mail. Dazwischen ein
  **Ähnlichkeits-Indikator**: „Sicher" (gelb) bzw. „Möglich" (blau/grau) + der Grund („gleiche E-Mail",
  „Name + Firma ähnlich").
- Pro Paar zwei Aktionen: **„Zusammenführen"** (primär) → öffnet Merge-Dialog · **„Kein Duplikat"**
  (sekundär) → entfernt das Paar dauerhaft aus der Liste (Merkliste gegen Wiedervorlage).
- **Leerer Zustand** (kein Duplikat): ruhige positive Meldung „Keine Duplikate — deine Datenbank ist sauber."
- Zustände: Laden (Skeleton), Fehler (ruhige Meldung + „Erneut"), nach Merge (Paar verschwindet + Toast).

## Merge-Dialog (Modal, geöffnet aus „Zusammenführen")
- Titel „Zusammenführen" + Hinweis „Ein Datensatz bleibt, der andere wandert in den Papierkorb."
- **Zwei Spalten** (Datensatz A | Datensatz B), Zeile pro Feld (Vorname, Nachname, E-Mail, Telefon,
  LinkedIn, Firma, Jobtitel, …). Je Feld ein **Auswahl-Steuerelement** (Radio/Klick), mit dem der User
  wählt, **welcher Wert bleibt** — Standard-Vorauswahl: der befülltere/„Primär"-Datensatz.
- Felder, in denen beide gleich sind: dezent zusammengefasst (eine Zeile, keine Wahl nötig).
- **Hinweis-Zeile unten:** „Alle Deals, Tasks, Notizen, Kommunikation und Listen-Mitgliedschaften beider
  Kontakte hängen danach am zusammengeführten Datensatz." (Ehrlichkeit — nichts geht verloren.)
- Footer: **„Zusammenführen"** (primär) + „Abbrechen". Nach Klick: Modal schließt, Toast „Zusammengeführt ✓".

## Durchgängig
- Badges = Status-Badge-Muster (Tint + Icon, kein voller Rahmen). Keine Emojis (Lucide).
- Alle Zustände (leer/laden/Fehler) mitdesignen. Tokens statt Hex, Radius-Hierarchie.

## Offene Produktentscheidung (bitte im Design berücksichtigen)
Der Merge-Dialog oben zeigt **Pro-Feld-Auswahl** (§13). Alternativ wäre „Bestand gewinnt automatisch,
fehlende Felder auffüllen" (CLAUDE Datenqualität #4) — dann bräuchte der Dialog **keine** Pro-Feld-Wahl,
nur eine Bestätigung + Vorschau, welcher Datensatz gewinnt. → Bitte entscheiden (siehe Chat).
