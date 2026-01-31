// Load env first
import '../env-loader';

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { REDIS_CONFIG, createModuleLogger } from '@boat-monitor/shared';

const logger = createModuleLogger('Queue');

// Redis connection
const connection = new IORedis({
  host: REDIS_CONFIG.HOST,
  port: REDIS_CONFIG.PORT,
  password: REDIS_CONFIG.PASSWORD,
  maxRetriesPerRequest: null
});

// Check queue
export const checkQueue = new Queue('check-queue', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600 // 24 hours
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600 // 7 days
    }
  }
});

// Notification queue
export const notificationQueue = new Queue('notification-queue', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 3600
    }
  }
});

// Note: QueueScheduler was removed in BullMQ v5, scheduling is now built into the Queue

// Health check
export async function checkQueueHealth(): Promise<boolean> {
  try {
    await connection.ping();
    logger.info('Queue connection healthy');
    return true;
  } catch (error) {
    logger.error('Queue connection failed', { error });
    return false;
  }
}

// Graceful shutdown
export async function closeQueues(): Promise<void> {
  try {
    await checkQueue.close();
    await notificationQueue.close();
    await connection.quit();
    logger.info('Queues closed');
  } catch (error) {
    logger.error('Error closing queues', { error });
  }
}

logger.info('Queue initialized', {
  host: REDIS_CONFIG.HOST,
  port: REDIS_CONFIG.PORT
});
