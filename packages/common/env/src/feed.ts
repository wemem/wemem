import { z } from 'zod';

export const feedSchema = z.object({
  description: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  latestFeedItemId: z.string().nullable().optional(),
});
