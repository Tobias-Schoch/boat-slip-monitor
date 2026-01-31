import { z } from 'zod';

export const MonitoredUrlSchema = z.object({
  id: z.string().uuid(),
  url: z.string().url(),
  name: z.string(),
  description: z.string().optional(),
  checkInterval: z.number().default(5),
  enabled: z.boolean().default(true),
  lastChecked: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type MonitoredUrl = z.infer<typeof MonitoredUrlSchema>;
