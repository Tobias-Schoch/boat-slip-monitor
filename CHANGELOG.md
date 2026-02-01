# Changelog

Notable changes to Website Change Monitor.

## [2.0.0] - Current

### Major Release - Generalized Website Monitoring

Complete transformation from niche tool to general-purpose website monitoring system.

#### Added
- **Configurable check intervals** via settings
- **Startup validation** with helpful error messages
- **Docker support** with optimized containers
- **Beautiful notifications**: Enhanced Telegram and HTML emails
- **Helper scripts**: Quick setup with colors and progress
- **GitHub-ready**: Issue templates, PR templates, LICENSE

#### Changed
- **Rebranded** to `website-change-monitor`
- **All text in English** (UI, notifications, docs)
- **Package names** updated to `@website-monitor/*`
- **Generic configuration** - monitor any website
- **Improved Docker** setup with better healthchecks
- **Professional notifications** with rich formatting

#### Technical
- Hash-based change detection (memory efficient)
- MarkdownV2 for Telegram (better formatting)
- HTML email templates with inline styles
- Standalone Next.js builds
- Better error handling and logging

---

## Migration from 1.x

```bash
# Update code
git pull

# Update dependencies
npm install

# Rebuild everything
npm run build

# Reset Docker (clean start)
docker-compose down -v
docker-compose up -d postgres redis

# Run migrations
npm run migrate

# Start services
docker-compose up -d
```

**Note**: Database name changed from `boat_monitor` to `website_monitor`.  
Update your `DATABASE_URL` in `.env` accordingly.
