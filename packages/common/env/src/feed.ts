import { z } from 'zod';

export const feedSchema = z.object({
  description: z.string(),
  image: z.string().nullable(),
});
