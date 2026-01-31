import { z } from 'zod';

export enum CheckStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  TIMEOUT = 'TIMEOUT',
  ERROR = 'ERROR'
}

export const CheckResultSchema = z.object({
  id: z.string().uuid(),
  urlId: z.string().uuid(),
  url: z.string().url(),
  status: z.nativeEnum(CheckStatus),
  responseTime: z.number(),
  statusCode: z.number().optional(),
  error: z.string().optional(),
  htmlHash: z.string().optional(),
  screenshotPath: z.string().optional(),
  checkedAt: z.date()
});

export type CheckResult = z.infer<typeof CheckResultSchema>;

export interface CheckMetrics {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime: number;
  lastCheckTime: Date | null;
}
