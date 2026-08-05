import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const destinations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/destinations' }),
  schema: z.object({
    title_en: z.string().min(1),
    title_pt: z.string().min(1),
    country_en: z.string().min(1),
    country_pt: z.string().min(1),
  }),
});

export const collections = { destinations };
