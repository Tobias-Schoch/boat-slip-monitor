# Website Change Monitor - Architecture

Technical architecture documentation for the website monitoring system.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interactions                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Telegram │  │  Email   │  │   SMS    │  │  Voice   │   │
│  └────▲─────┘  └────▲─────┘  └────▲─────┘  └────▲─────┘   │
│       │             │             │             │           │
└───────┼─────────────┼─────────────┼─────────────┼───────────┘
        │             │             │             │
        │      ┌──────┴─────────────┴─────────────┴──────┐
        │      │    Notification Dispatcher              │
        │      │    - Priority routing                    │
        │      │    - Rate limiting                       │
        │      │    - Retry logic                         │
        │      └──────▲───────────────────────────────────┘
        │             │
        │      ┌──────┴──────────────────────────────────┐
        │      │    Monitor Job Scheduler (BullMQ)       │
        │      │    - Cron: */5 * * * *                  │
        │      │    - Job queue management                │
        │      │    - Worker pool                         │
        │      └──────▲───────────────────────────────────┘
        │             │
        │      ┌──────┴──────────────────────────────────┐
        │      │    Change Detector                       │
        │      │    - HTML normalization                  │
        │      │    - Keyword detection                   │
        │      │    - Form detection                      │
        │      │    - Diff generation                     │
        │      └──────▲───────────────────────────────────┘
        │             │
        │      ┌──────┴──────────────────────────────────┐
        │      │    Page Scraper (Playwright)            │
        │      │    - Browser automation                  │
        │      │    - Screenshot capture                  │
        │      │    - HTML extraction                     │
        │      │    - Anti-bot measures                   │
        │      └──────▲───────────────────────────────────┘
        │             │
        │      ┌──────┴──────────────────────────────────┐
        │      │    Monitored URLs                        │
        │      │    - Configurable via dashboard          │
        │      │    - Multiple URLs supported             │
        │      └──────────────────────────────────────────┘
        │
        │      ┌─────────────────────────────────────────┐
        └─────▶│    Web Dashboard (Next.js)               │
               │    - Live status                         │
               │    - Change history                      │
               │    - Screenshots gallery                 │
               │    - Settings                            │
               └──────▲───────────────────────────────────┘
                      │
               ┌──────┴───────────────────────────────────┐
               │    Database (PostgreSQL)                 │
               │    - Checks history                      │
               │    - Changes log                         │
               │    - Notifications log                   │
               │    - HTML snapshots                      │
               └──────────────────────────────────────────┘
```

## Component Details

### 1. Playwright Manager

**Purpose**: Browser automation and anti-bot detection

**Features**:
- Browser pool (4 persistent contexts)
- Stealth scripts (override navigator.webdriver)
- Configurable geolocation
- Customizable locale and User-Agent

**Files**:
- `packages/monitor/src/scraper/playwright-manager.ts`

### 2. Page Scraper

**Purpose**: Scrape web pages and capture screenshots

**Features**:
- Retry logic (3 attempts, exponential backoff)
- Full-page screenshots
- HTML extraction with networkidle
- HTML normalization (remove dynamic content)

**Files**:
- `packages/monitor/src/scraper/page-scraper.ts`

### 3. Change Detector

**Purpose**: Detect meaningful changes on web pages

**Detection Methods**:
1. **Form Detection**: HTML forms, PDF links, application forms
2. **Keyword Detection**: Critical and important keywords
3. **Content Similarity**: Levenshtein distance < 95%

**Priority Classification**:
- **CRITICAL**: Form detected, critical keywords matched
- **IMPORTANT**: Important keywords matched
- **INFO**: Regular content changes

**Files**:
- `packages/monitor/src/detector/change-detector.ts`

### 4. Job Scheduler (BullMQ)

**Purpose**: Schedule and manage monitoring jobs

**Configuration**:
- Cron: `*/5 * * * *` (every 5 minutes)
- Concurrency: 1 (sequential processing)
- Job persistence: 100 completed, 500 failed
- Retry: 3 attempts with exponential backoff

**Queue Flow**:
```
Cron Trigger
    ↓
Check All URLs Job
    ↓
[URL 1 Job] [URL 2 Job] [URL 3 Job] [URL 4 Job]
    ↓           ↓           ↓           ↓
Worker Pool (Concurrency: 1)
```

**Files**:
- `packages/monitor/src/scheduler/queue.ts`
- `packages/monitor/src/scheduler/cron.ts`
- `packages/monitor/src/scheduler/monitor-job.ts`

### 5. Notification Dispatcher

**Purpose**: Multi-channel notification delivery

**Channels**:
1. **Telegram**: All priorities, instant delivery
2. **Email**: IMPORTANT + CRITICAL
3. **SMS**: CRITICAL only
4. **Voice**: CRITICAL only (optional)

**Features**:
- Priority-based routing
- Rate limiting (configurable per channel)
- Deduplication (5-minute window)
- Retry with exponential backoff (5 attempts)
- Fallback chain: Telegram → Email → SMS → Voice

**Files**:
- `packages/monitor/src/notifier/notification-dispatcher.ts`
- `packages/monitor/src/notifier/channels/telegram.ts`
- `packages/monitor/src/notifier/channels/email.ts`
- `packages/monitor/src/notifier/channels/sms.ts`
- `packages/monitor/src/notifier/channels/voice.ts`

### 6. Database (PostgreSQL)

**Schema**:

```sql
monitored_urls
├── id (PK)
├── url
├── name
├── enabled
└── last_checked

checks
├── id (PK)
├── url_id (FK)
├── status
├── response_time
├── html_hash
├── screenshot_path
└── checked_at

html_snapshots
├── id (PK)
├── check_id (FK)
├── html_hash (unique)
├── content
└── normalized_content

changes
├── id (PK)
├── check_id (FK)
├── url_id (FK)
├── type
├── priority
├── confidence
├── description
├── diff
└── detected_at

notifications
├── id (PK)
├── change_id (FK)
├── channel
├── priority
├── status
├── attempts
└── created_at
```

**Files**:
- `packages/database/src/schema/*.ts`
- `packages/database/src/migrations/001_initial_schema.sql`
- `packages/database/src/repositories/*.ts`

### 7. Web Dashboard (Next.js 14)

**Pages**:
- `/` - Dashboard (live status, recent checks)
- `/history` - Change timeline with diffs
- `/screenshots` - Screenshot gallery
- `/settings` - Configuration and test buttons

**API Routes**:
- `GET /api/health` - System health check
- `GET /api/checks` - Check history
- `GET /api/changes` - Change history
- `POST /api/notifications/test` - Test notification

**Files**:
- `packages/web/src/app/*.tsx`
- `packages/web/src/app/api/*/route.ts`

## Data Flow

### Check Execution Flow

```
1. Cron Trigger (every 5 min)
   ↓
2. Fetch enabled URLs from DB
   ↓
3. Queue check job for each URL
   ↓
4. Worker picks up job
   ↓
5. Scrape page with Playwright
   ├─ Extract HTML
   ├─ Take screenshot
   └─ Calculate hash
   ↓
6. Store check result in DB
   ↓
7. Get previous HTML snapshot
   ↓
8. Detect changes
   ├─ Form detection
   ├─ Keyword matching
   └─ Content similarity
   ↓
9. If change detected:
   ├─ Store change in DB
   └─ Dispatch notifications
       ├─ Telegram
       ├─ Email
       ├─ SMS
       └─ Voice (optional)
   ↓
10. Update metrics
```

### Notification Flow

```
Change Detected
   ↓
Classify Priority (INFO/IMPORTANT/CRITICAL)
   ↓
Get enabled channels for priority
   ↓
For each channel:
   ├─ Check rate limit
   ├─ Check deduplication
   ├─ Create notification record
   ├─ Send via channel
   └─ Update status (SENT/FAILED)
   ↓
If failed:
   ├─ Increment attempts
   ├─ Schedule retry (exponential backoff)
   └─ Fallback to next channel if max attempts reached
```

## Scalability Considerations

### Current Limits

- **URLs**: 4 (can easily handle 50+)
- **Check Frequency**: Every 5 minutes
- **Concurrent Checks**: 1 (sequential)
- **Browser Pool**: 4 contexts

### Scaling Up

To monitor more URLs or check more frequently:

1. **Increase Worker Concurrency**
   ```typescript
   // In monitor-job.ts
   concurrency: 4  // Process 4 URLs in parallel
   ```

2. **Increase Browser Pool**
   ```typescript
   // In playwright-manager.ts
   private readonly poolSize: number = 8;
   ```

3. **Add More Workers**
   ```bash
   # Start multiple monitor instances
   docker-compose up --scale monitor=3
   ```

4. **Optimize Database**
   ```sql
   -- Add indexes for faster queries
   CREATE INDEX idx_checks_url_checked ON checks(url_id, checked_at DESC);
   ```

## Security

### Anti-Bot Measures

1. **Browser Fingerprinting**
   - Real Chrome User-Agent
   - Navigator.webdriver = false
   - Plugins array populated
   - Chrome runtime object

2. **Geolocation**
   - Set to Konstanz (47.6596, 9.1753)
   - Consistent with target audience

3. **Request Behavior**
   - Wait for networkidle
   - Random delays between requests
   - Realistic viewport size (1920x1080)

### Data Security

1. **Secrets Management**
   - All credentials in .env (not committed)
   - Environment variables only

2. **Database Security**
   - PostgreSQL with authentication
   - SSL in production (recommended)
   - Regular backups

3. **API Security**
   - Rate limiting on notification endpoints
   - No public API keys

## Monitoring & Observability

### Logging

- **Winston Logger**: Structured JSON logging
- **Log Levels**: error, warn, info, debug
- **Log Rotation**: 5 files, 5MB each

### Metrics

- Check success rate
- Average response time
- Notification delivery rate
- Queue depth

### Health Checks

- Database connection
- Redis connection
- Playwright browser pool
- API health endpoint

## Technologies

### Backend
- **Node.js 20**: Runtime
- **TypeScript**: Type safety
- **Playwright**: Browser automation
- **BullMQ**: Job queue
- **Drizzle ORM**: Database ORM

### Frontend
- **Next.js 14**: React framework
- **Tailwind CSS**: Styling
- **Recharts**: Charts

### Database
- **PostgreSQL 16**: Primary database
- **Redis 7**: Job queue backend

### Notifications
- **node-telegram-bot-api**: Telegram
- **Nodemailer**: Email
- **Twilio**: SMS & Voice

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **PM2**: Process management (local)

## Performance

### Resource Usage

- **CPU**: ~5% average (spikes during checks)
- **Memory**: ~500MB (monitor) + ~200MB (web)
- **Disk**: ~10GB (with screenshots)
- **Network**: ~10MB/day (4 URLs, every 5 min)

### Optimization

1. **Screenshot Compression**
   - PNG → JPEG (70% quality)
   - Reduce from 2MB to 200KB

2. **HTML Deduplication**
   - Hash-based storage
   - Only store unique snapshots

3. **Database Cleanup**
   - Delete old screenshots (90 days)
   - Archive old checks

## Future Enhancements

### Planned Features

1. **Advanced Change Detection**
   - OCR for text in images
   - Semantic similarity (embeddings)
   - Historical trend analysis

2. **Machine Learning**
   - Predict opening dates
   - Anomaly detection

3. **User Management**
   - Multi-user support
   - Role-based access
   - Custom notification preferences

4. **Enhanced Dashboard**
   - Real-time updates (WebSockets)
   - Interactive charts
   - Mobile app

5. **Integrations**
   - Slack notifications
   - Discord webhooks
   - Calendar integration

## Contributing

See main README.md for contribution guidelines.

## License

MIT License
