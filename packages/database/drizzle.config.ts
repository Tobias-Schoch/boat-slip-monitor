import type { Config } from 'drizzle-kit';

export default {
  schema: './src/schema/*.ts',
  out: './src/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL || 'postgresql://boat_monitor:password@localhost:5432/boat_monitor'
  }
} satisfies Config;
