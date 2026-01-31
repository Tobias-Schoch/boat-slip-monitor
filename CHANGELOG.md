# Changelog

All notable changes to the Boat Slip Monitor project.

## [1.0.0] - 2026-01-31

### Added - Initial Release

#### Core Features
- **24/7 Monitoring System** for boat slip waiting list in Konstanz
- **Intelligent Change Detection**:
  - HTML normalization and comparison
  - Keyword-based detection (critical and important keywords)
  - Form detection (HTML forms and PDF links)
  - Levenshtein-based content similarity
- **Multi-Channel Notifications**:
  - Telegram (instant messages with inline buttons)
  - Email (HTML formatted with screenshots)
  - SMS (Twilio integration)
  - Voice calls (optional, Twilio)
- **Priority System**: INFO, IMPORTANT, and CRITICAL levels
- **Next.js Dashboard**:
  - Live system status
  - Change history with timeline
  - Screenshot gallery
  - Settings page
  - Health check API

#### Technical Implementation
- **Monorepo Structure** with Turbo
- **Backend**: Node.js/TypeScript
- **Browser Automation**: Playwright with anti-bot measures
- **Job Scheduling**: BullMQ with Redis (5-minute intervals)
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Frontend**: Next.js 14 App Router with Tailwind CSS

#### Deployment
- Docker Compose configuration for production
- Multi-stage Dockerfiles for optimization
- PM2 support for local deployment
- Automated deployment scripts:
  - `setup.sh` - Interactive initial setup
  - `deploy-local.sh` - Local deployment with PM2
  - `deploy-vps.sh` - VPS deployment with Docker
  - `backup.sh` - Database and screenshot backup
  - `test-notification.sh` - Test notification channels

#### Developer Experience
- **Interactive Setup Script** (`setup.sh`):
  - Prompts for all credentials
  - Automatically generates .env file
  - Validates required fields
  - Shows configuration summary
  - Provides next steps guidance
- **Credential Management Script** (`configure-credentials.sh`):
  - Selective credential updates
  - Preserves existing configuration
  - Automatic backups before changes
  - Menu-driven interface
- Comprehensive documentation:
  - README.md - Quick start guide
  - SETUP.md - Detailed setup instructions
  - ARCHITECTURE.md - Technical architecture
  - CHANGELOG.md - Version history

#### Monitoring URLs
- konstanz.de boat slip page
- konstanz.de service portal
- service-bw.de leistungen page
- service-bw.de online application

#### Security & Reliability
- Anti-bot measures (User-Agent spoofing, geolocation)
- Rate limiting on notifications
- Retry logic with exponential backoff
- Deduplication (5-minute window)
- Circuit breaker pattern
- Health check endpoints
- Structured logging (Winston)

#### Database Schema
- `monitored_urls` - URLs being monitored
- `checks` - Check execution history
- `html_snapshots` - Deduplicated HTML content
- `changes` - Detected changes with metadata
- `screenshots` - Screenshot metadata
- `detected_forms` - Form detection results
- `notifications` - Notification delivery log
- `notification_channels` - Channel configuration
- `user_settings` - User preferences
- `system_metrics` - Performance metrics

### Interactive Setup Improvements [Current]

#### Enhanced Setup Process
- **Interactive Credential Collection**:
  - Step-by-step prompts for all credentials
  - Clear instructions for each service (Telegram, Email, Twilio)
  - Optional field skipping (press Enter to skip)
  - Password masking for sensitive inputs
  - Automatic .env file generation

- **Smart Default Values**:
  - Pre-filled common values (SMTP host, ports)
  - Current value preservation when reconfiguring
  - Environment-appropriate defaults

- **Configuration Summary**:
  - Visual status indicators (✓ ✗ ○)
  - Shows what's configured vs missing
  - Highlights required vs optional fields

- **Backup & Safety**:
  - Automatic backup of existing .env files
  - Timestamped backup files
  - Confirmation before overwriting

- **Selective Reconfiguration**:
  - Menu-driven credential updates
  - Update only what you need:
    1. All credentials
    2. Telegram only
    3. Email only
    4. SMS/Voice only
    5. Database password only
  - Preserves unchanged settings

#### User Experience Improvements
- **Guided Setup Flow**:
  - Clear section headers and separators
  - Step-by-step instructions for external services
  - Helpful links to credential sources
  - Progress indicators

- **Post-Setup Guidance**:
  - Configuration summary with visual indicators
  - Next steps checklist
  - Testing instructions
  - Documentation references

- **Error Prevention**:
  - Validation of required fields
  - Warning for missing critical credentials
  - Backup creation before changes
  - Restart instructions after reconfiguration

#### Scripts Added
- `scripts/setup.sh` - Interactive initial setup with credential prompts
- `scripts/configure-credentials.sh` - Update credentials without full setup

#### Documentation Updates
- README.md updated with interactive setup instructions
- Clear distinction between easy (interactive) and manual setup
- Credential setup section with platform-specific instructions
- Testing section for validating notifications

### Next Planned Features

#### v1.1.0 (Planned)
- [ ] Screenshot comparison viewer in dashboard
- [ ] WebSocket for real-time dashboard updates
- [ ] Email digest (daily/weekly summaries)
- [ ] Custom keyword configuration via UI
- [ ] Export change history to CSV/PDF

#### v1.2.0 (Planned)
- [ ] Multi-user support with authentication
- [ ] Custom notification rules (per user)
- [ ] Slack and Discord integrations
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and charts

#### v2.0.0 (Future)
- [ ] Machine learning for opening date prediction
- [ ] OCR for text extraction from images
- [ ] Semantic similarity with embeddings
- [ ] Historical trend analysis
- [ ] Anomaly detection
- [ ] Multi-location monitoring

## Version History

- **1.0.0** (2026-01-31) - Initial release with interactive setup
- Development started: 2026-01-31
- MVP completed: 2026-01-31

## License

MIT License - See LICENSE file for details
