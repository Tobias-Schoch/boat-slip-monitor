# Boat Slip Monitor - Monitor Service

## Übersicht

Der Monitor-Service überwacht die konfigurierten URLs auf Änderungen und erstellt automatisch Screenshots sowie Change-Detection-Ereignisse.

## Installation

```bash
npm install
npx playwright install chromium
```

## Verwendung

### Monitor-Service starten

```bash
# Development-Modus mit Auto-Reload
npm run dev

# Production-Modus
npm run build
npm start
```

### Initiale Screenshots erstellen

Um den aktuellen Stand aller URLs als Baseline zu erfassen:

```bash
npm run initial-check
```

Dieses Script:
- Lädt alle aktivierten URLs
- Erstellt Screenshots für jede URL
- Speichert HTML-Snapshots in der Datenbank
- Erstellt "Initialer Stand"-Einträge im Verlauf
- Markiert URLs als zuletzt geprüft

**Wichtig:** Führe dieses Script nach jeder Änderung der überwachten URLs aus, um einen sauberen Ausgangszustand zu haben.

## Konfiguration

Die Konfiguration erfolgt über die Datenbank-Tabelle `app_settings` oder über das Web-Dashboard unter `/settings`.

### Wichtige Einstellungen:

- **check_interval_minutes**: Intervall zwischen den Checks (Standard: 5 Minuten)
- **screenshot_dir**: Verzeichnis für Screenshots (Standard: `./data/screenshots`)
- **log_level**: Log-Level (debug, info, warn, error)

## Architektur

```
src/
├── scraper/          # Playwright-basierte Web-Scraper
├── detector/         # Change-Detection-Logik
├── scheduler/        # BullMQ Job-Scheduler
├── notifier/         # Multi-Channel Benachrichtigungen
├── scripts/          # Utility-Scripts
│   └── initial-check.ts  # Initial Screenshot Script
└── index.ts          # Haupteinstiegspunkt
```

## Entwicklung

```bash
# TypeScript-Typen prüfen
npm run lint

# Build erstellen
npm run build

# Development-Server
npm run dev
```

## Troubleshooting

### "Playwright browser not found"

```bash
npx playwright install chromium
```

### Screenshots werden nicht gespeichert

Stelle sicher, dass das Screenshot-Verzeichnis existiert und beschreibbar ist:

```bash
mkdir -p data/screenshots
chmod 755 data/screenshots
```

### Database connection failed

Überprüfe die `DATABASE_URL` in der `.env`-Datei und stelle sicher, dass PostgreSQL läuft:

```bash
docker-compose up -d postgres
```
