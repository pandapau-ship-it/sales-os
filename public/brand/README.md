# Brand-Kanal-Logos (statische SVG-Assets)

Diese Dateien werden über `BrandLogo` (`src/components/shared/BrandLogo.tsx`) als
`<img src="/brand/<name>.svg">` geladen und z. B. im Hunter-Sidepanel
(Kommunikations-Items) als Kanal-Kennzeichnung angezeigt.

## Dateien (exakte Namen behalten!)

| Datei              | Kanal          |
|--------------------|----------------|
| `teams.svg`        | Microsoft Teams|
| `outlook.svg`      | Outlook        |
| `gmail.svg`        | Gmail          |
| `google-meet.svg`  | Google Meet    |
| `linkedin.svg`     | LinkedIn       |

## Aktueller Stand: offizielle Logos hinterlegt

Hier liegen die offiziellen Marken-Logos (vom Nutzer bereitgestellt, icons8-Set).
`BrandLogo` rendert sie auf einer Surface-Kachel (`tile`), damit die meist
transparenten Logos in Light- UND Dark-Mode sauber sitzen.

## Durch andere Logos ersetzen

Einfach die jeweilige Datei mit demselben Dateinamen überschreiben — **kein
Code-Change nötig**. Empfohlen:

- Quadratisches SVG (viewBox `0 0 48 48` o. ä.), idealerweise mit eigener
  Marken-Kachel/-Hintergrund, damit es auf hellem UND dunklem App-Hintergrund sitzt.
- Offizielle Assets über die jeweiligen Brand-/Press-Ressourcen der Anbieter beziehen
  und deren Nutzungsbedingungen beachten.
- Fehlt eine Datei, fällt `BrandLogo` automatisch auf den eingebauten Glyph
  (`src/components/shared/BrandIcons.tsx`) zurück — nichts bricht.
