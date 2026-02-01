import { createModuleLogger } from '@website-monitor/shared';
import { db } from '@website-monitor/database';

const logger = createModuleLogger('StartupValidator');

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateStartup(): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: []
  };

  logger.info('Running startup validation checks...');

  const requiredEnvVars = ['DATABASE_URL', 'REDIS_HOST', 'REDIS_PORT'];
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingEnvVars.length > 0) {
    result.valid = false;
    result.errors.push('Missing: ' + missingEnvVars.join(', '));
  }

  const hasTelegram = process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID;
  const hasEmail = process.env.SMTP_HOST && process.env.SMTP_USER;

  if (!hasTelegram && !hasEmail) {
    result.warnings.push('No notification channels configured');
  }

  try {
    await db.execute('SELECT 1');
    logger.info('Database OK');
  } catch (error) {
    result.valid = false;
    result.errors.push('Database failed');
  }

  if (result.valid) {
    logger.info('Startup validation passed');
  } else {
    logger.error('Startup validation failed');
    result.errors.forEach(err => logger.error(err));
  }

  return result;
}
