# AI-Studio-Design-Prompt — K-5 Import-Bildschirm (Kontakte-Import)

> Für Oliver zum Einfügen in AI Studio. Danach: Mocks raus, in bestehende Library-Komponenten
> übersetzen (nie 1:1-Copy). Alle Farben/Radien/Schriften werden beim Bau auf unsere CSS-Tokens
> gemappt — das Design liefert Layout + Zustände, nicht die Werte.

---

## Kontext

Ein B2B-Sales-CRM (React, sehr aufgeräumt, ruhig, „calm · intelligent · action-oriented",
Deep-Teal-Akzent `#185557`, Plus Jakarta Sans, App-Hintergrund hellgrau `#F8FAFC`, Karten weiß,
weiche diffuse Schatten, großzügige Radien). Es gibt bereits eine Kontakte-Tabelle. Jetzt fehlt der
**Import-Bildschirm**: der Nutzer lädt eine CSV/Excel hoch und importiert Kontakte.

Baue einen **4-Schritt-Flow als eigene, vollflächige Seite** (kein kleines Modal — es gibt Tabellen
mit vielen Zeilen). Oben ein horizontaler **Stepper** (4 Schritte, aktueller hervorgehoben, erledigte
mit Häkchen), darunter der Schritt-Inhalt, unten eine feste Fußzeile mit „Zurück" / primärer
Weiter-Aktion. Titel oben links „Kontakte importieren", oben rechts ein ✕ (zurück zur Kontakte-Liste).

## Schritt 1 — Datei hochladen
- Große **Dropzone** (gestrichelter Rahmen, zentriertes Upload-Icon): „Datei hierher ziehen oder
  auswählen". Untertext: „CSV oder Excel (.xlsx) · max. 20 MB / 50.000 Zeilen".
- Nach Auswahl: **Datei-Karte** mit Dateiname, Größe, Zeilenzahl, erkanntem Format (z.B.
  „CSV · Semikolon-getrennt · UTF-8") und einem ✕ zum Entfernen.
- **Hinweis-Zeile** (dezent, Info-Ton) wenn die Engine etwas meldet (z.B. „Mehrere Tabellenblätter —
  erstes verwendet", „Encoding automatisch korrigiert").
- Optional: kleine Zeile „Erwartete Spalten: Vorname, Nachname, E-Mail, LinkedIn … (eines von
  Name/LinkedIn genügt)".
- **Leerer/Fehlerzustand:** ungültige Datei → ruhige Meldung „Diese Datei konnten wir nicht lesen —
  bitte CSV oder Excel", kein technischer Fehlertext.

## Schritt 2 — Spalten zuordnen (Mapping)
- Überschrift „Spalten zuordnen" + Untertext „Wir haben deine Spalten automatisch erkannt — prüfe
  und korrigiere bei Bedarf."
- **Tabelle**, eine Zeile pro Datei-Spalte, Spalten:
  1. **Deine Spalte** (Header aus der Datei, fett)
  2. **Beispielwerte** (2–3 echte Werte aus den ersten Zeilen, grau)
  3. **Ziel-Feld** = Dropdown (Vorname, Nachname, E-Mail, LinkedIn-URL, Telefon, Jobtitel,
     Seniorität, Firma, Stadt, Land, Tags, Notizen, **„Nicht importieren"**)
- Automatisch erkannte Zuordnungen zeigen ein kleines Häkchen/„erkannt"-Label; unerkannte Spalten
  stehen auf „Nicht importieren" und sind sichtbar markiert (dezenter Warn-Ton, kein Alarm).
- **Vorlagen-Hinweis oben** (wenn die Spaltenstruktur wiedererkannt wurde): dezente Zeile
  „Vorlage 'HubSpot-Export' erkannt — Zuordnung übernommen." (nur Anzeige)
- **Zustände:** alle Spalten „Nicht importieren" → Weiter deaktiviert + Hinweis „Ordne mindestens
  Name oder LinkedIn zu".

## Schritt 3 — Prüfen & Duplikate (Validierungs-Vorschau)
- **Vier kompakte Zähl-Kacheln** oben: **Importierbar** (grün) · **Duplikate** (gelb) · **Fehler**
  (rot) · **Gesamt** (neutral). Echte Zahlen.
- **Vorschau-Tabelle** (erste ~50 Zeilen + alle Fehlerzeilen), Spalten: Vorname · Nachname · E-Mail ·
  Firma · **Status**. Status als Badge:
  - **OK** (grün, Häkchen)
  - **Duplikat** (gelb) mit Zusatz „sicher" oder „möglich" + kleiner Pro-Zeile-Auswahl
    (Überspringen / Zusammenführen / Trotzdem anlegen)
  - **Fehler** (rot) mit Grund direkt in der Zeile (z.B. „E-Mail ungültig", „Name oder LinkedIn fehlt")
- **Bulk-Leiste** über der Tabelle: „Alle sicheren Duplikate überspringen", Filter-Chips
  (Alle / Nur Duplikate / Nur Fehler).
- **Ehrlichkeits-Hinweis:** Fehlerzeilen werden nie still verworfen — „X fehlerhafte Zeilen als CSV
  herunterladen"-Link.
- Fußzeile: primärer Button „**X Kontakte importieren**" (echte Zahl der importierbaren), erst nach
  bewusstem Klick. Fehler-/Duplikat-Zeilen sind vom Import ausgenommen bzw. folgen der Pro-Zeile-Wahl.

## Schritt 4 — Import & Report
- Während des Imports: **Fortschrittsbalken** + „Importiere … 320 / 480" (kein hängender Spinner).
- Danach **Report-Karte** mit den echten Zahlen: „**312 erstellt** · **28 aktualisiert/zusammengeführt**
  · **140 übersprungen (Duplikat)** · **0 fehlerhaft**".
- Zwei Aktionen: „**Zu den Kontakten**" (primär) und „**Import rückgängig**" (sekundär, dezent) mit
  Untertext „Entfernt nur die in diesem Import neu erstellten Kontakte (bis 7 Tage)."
- **Fehlerzustand Import:** „Ein Teil konnte nicht importiert werden — du kannst es erneut versuchen",
  Aktion „Nochmal versuchen", nie ein roher Fehler.

## Durchgängig
- Ruhig, viel Weißraum, keine grellen Farben. Rot ausschließlich für echte Fehler.
- **Alle Zustände mitdesignen:** leer (noch keine Datei), Laden, Fehler, „nichts zu importieren"
  (alle Zeilen Duplikat/Fehler → ehrliche Meldung, kein leerer Balken).
- Badges: kleiner Tint-Hintergrund + Icon/Punkt, kein voller Rahmen (Status-Badge-Muster des Systems).
- Keine Emojis — schlichte Lucide-Icons.

## Nicht Teil dieses Designs (bewusst ausgelassen)
- CRM-Sync (HubSpot/Salesforce) — späterer, eigener Flow.
- Companies-Import — dieser Flow ist Kontakt-zentriert (Firmen werden über Domain-Match verknüpft/
  angelegt, kein eigener Firmen-Upload-Screen).
