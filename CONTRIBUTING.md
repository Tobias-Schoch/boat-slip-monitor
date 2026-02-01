# Contributing to Website Change Monitor

Thanks for your interest in contributing! This document provides guidelines and setup instructions.

## Development Setup

### Prerequisites

- Node.js 20+
- Docker Desktop
- Git
- Your favorite code editor (VS Code recommended)

### First Time Setup

```bash
# Clone the repo
git clone <repo-url>
cd website-change-monitor

# Run quick setup
./scripts/quick-setup.sh

# Configure your .env with test credentials
cp .env.example .env
```

### Development Workflow

```bash
# Start development mode (starts everything)
./scripts/dev.sh

# Or start services individually:
npm run monitor  # Terminal 1
npm run web      # Terminal 2
```

## Project Structure

```
website-change-monitor/
├── packages/
│   ├── shared/       # Shared types, utilities, constants
│   ├── database/     # Database schemas, migrations, repositories
│   ├── monitor/      # Backend monitoring service
│   └── web/          # Next.js dashboard
├── scripts/          # Helper scripts
└── docker-compose.yml
```

## Making Changes

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

#### Adding a New Feature

1. Add types to `packages/shared/src/types/`
2. Add database schema to `packages/database/src/schema/`
3. Implement logic in appropriate package
4. Add tests if applicable

#### Modifying Existing Code

- Follow existing code style
- Update TypeScript types
- Test your changes locally

### 3. Build and Test

```bash
# Build all packages
npm run build

# Lint check
npm run lint

# Test manually
npm run dev
```

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add new feature description"

# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Open a PR against `main` branch
- Describe your changes
- Link any related issues

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define proper types (avoid `any`)
- Use `const` over `let` when possible
- Prefer async/await over callbacks

### Naming Conventions

- **Files**: kebab-case (`my-component.tsx`)
- **Components**: PascalCase (`MyComponent`)
- **Functions**: camelCase (`myFunction`)
- **Constants**: UPPER_SNAKE_CASE (`MY_CONSTANT`)

### Code Style

```typescript
// Good
export async function fetchData(): Promise<Data> {
  try {
    const result = await api.getData();
    return result;
  } catch (error) {
    logger.error('Failed to fetch data', { error });
    throw error;
  }
}

// Bad
export async function fetchData() {
  let result = await api.getData()
  return result
}
```

## Database Changes

### Creating a Migration

```bash
cd packages/database
npm run migrate:create my-migration-name
```

Edit the generated file in `packages/database/src/migrations/`

```typescript
export async function up(db: any) {
  await db.execute(`
    ALTER TABLE my_table
    ADD COLUMN new_field TEXT;
  `);
}

export async function down(db: any) {
  await db.execute(`
    ALTER TABLE my_table
    DROP COLUMN new_field;
  `);
}
```

### Running Migrations

```bash
npm run migrate
```

## Adding Dependencies

```bash
# To shared package
npm install <package> --workspace=@website-monitor/shared

# To monitor package
npm install <package> --workspace=@website-monitor/monitor

# To web package
npm install <package> --workspace=@website-monitor/web

# Dev dependency (root level)
npm install -D <package>
```

## Testing

### Manual Testing

```bash
# Start development environment
./scripts/dev.sh

# Test scenarios:
# 1. Add a URL via dashboard
# 2. Wait for check to run
# 3. Verify change detection works
# 4. Check notifications are sent
```

### Docker Testing

```bash
# Build and test with Docker
docker-compose build
docker-compose up -d
docker-compose logs -f monitor
```

## Troubleshooting Development Issues

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Database Issues

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run migrate
```

### Build Failures

```bash
# Clean everything
npm run clean
rm -rf node_modules
npm install
npm run build
```

## Documentation

When adding features:
- Update README.md if user-facing
- Update DEPLOYMENT.md if affects deployment
- Add inline code comments for complex logic
- Update TypeScript types

## Questions?

- Open an issue for bugs
- Start a discussion for feature ideas
- Check existing issues first

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
