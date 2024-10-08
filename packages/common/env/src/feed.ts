import { z } from 'zod';

export const feedSchema = z.object({
  url: z.string(),
  description: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  latestFeedItemId: z.string().nullable().optional(),
});
