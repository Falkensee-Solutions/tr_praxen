# Therapiepraxen-Karte

Interaktive Karte muttersprachlicher Psychotherapiepraxen in Deutschland – gehostet über
**GitHub Pages**, optisch an [praxis-cebi.de](https://www.praxis-cebi.de/) angelehnt.
Die Daten stammen aus einer öffentlichen Google-Tabelle und werden **jede Nacht automatisch**
aktualisiert.

## Funktionen

- OpenStreetMap-Karte (Leaflet) mit Marker-Clustering – zoom- und verschiebbar
- Filter nach **Bundesland**, **Zielgruppe** und **Finanzierung** + Freitextsuche (Name/Ort/PLZ)
- AirBnb-ähnliches Layout: Liste + Karte synchronisiert (Klick/Hover)
- Kontaktmöglichkeiten je Praxis (Telefon, E-Mail, Website, Route)
- Responsiv (Mobil: Umschalten zwischen Liste und Karte)
- Nachgebauter Header von praxis-cebi.de, Kontaktblock statt Footer

## Projektstruktur

```
index.html                     Kartenseite (Header, Karte, Kontaktblock)
assets/css/styles.css          Design
assets/js/app.js               Karte, Filter, Suche, Liste<->Karte-Sync
data/practices.json            Generierte Daten (nicht manuell bearbeiten)
scripts/build-data.mjs         Holt die Tabelle als CSV -> practices.json
tr_praxen.csv                  Lokale Referenz-/Fallback-Daten
.github/workflows/update-data.yml  Nächtliche Aktualisierung
```

## Einrichtung

### 1. Google-Tabelle öffentlich freigeben
Die Tabelle muss ohne Login lesbar sein:
**Freigeben → Allgemeiner Zugriff → „Jeder mit dem Link" → Betrachter.**

Die verwendete Tabellen-ID steht in [`scripts/build-data.mjs`](scripts/build-data.mjs)
(`SHEET_ID`). Erwartete Spalten:
`Name, Strasse, PLZ, Ort, Bundesland, Telefon, Email, Website, Zielgruppe, Finanzierung, Lat, Lng`
(Koordinaten im deutschen Komma-Format, z. B. `50,0851`, sind erlaubt.)

### 2. GitHub Pages aktivieren
Repository → **Settings → Pages** → Source: **Deploy from a branch** →
Branch `main`, Ordner `/ (root)`. Die Seite ist danach unter
`https://<benutzer>.github.io/<repo>/` erreichbar.

### 3. Automatische Aktualisierung
Der Workflow [`update-data.yml`](.github/workflows/update-data.yml) läuft täglich nachts,
bei jedem Push und lässt sich unter **Actions → „Praxen-Daten aktualisieren" → Run workflow**
manuell starten. Er committet `data/practices.json` nur bei tatsächlichen Änderungen.

## Lokal testen

```powershell
# Daten erzeugen
node scripts/build-data.mjs

# Lokalen Webserver starten (Python) und Seite öffnen
python -m http.server 8000
# -> http://localhost:8000/
```

## In WordPress (praxis-cebi.de) einbetten

Die Seite bringt einen **Embed-Modus** mit: Mit dem Parameter `?embed=1` werden Header,
Intro und Kontaktblock ausgeblendet – so liefert Ihre WordPress-Seite den echten Rahmen.
Fügen Sie auf einer neuen WordPress-Seite einen **HTML-Block** ein:

```html
<iframe
  src="https://<benutzer>.github.io/<repo>/?embed=1"
  title="Therapiepraxen-Karte"
  style="width:100%; height:80vh; border:0;"
  loading="lazy"
  allowfullscreen>
</iframe>
```

Alternativ kann die Seite **eigenständig** (mit nachgebautem Header) unter der GitHub-Pages-URL
verlinkt werden.

## Hinweise

- Kartenkacheln von OpenStreetMap – kein API-Schlüssel nötig, DSGVO-freundlicher als Google Maps.
- Koordinaten müssen in der Tabelle vorhanden sein (kein Geocoding).
