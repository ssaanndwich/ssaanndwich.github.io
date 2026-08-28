import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const notes = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/notes' }),
  schema: z.object({
    // Shown as the <h1>
    title: z.string(),
    // Shown as the <h2> under the title (the little quote/tagline each note has)
    subtitle: z.string().optional(),
    // Publicly shown "published" date
    date: z.coerce.date(),
    // Internal edit-tracking date. Not shown unless showUpdated is true -
    // update this on any real rewrite, skip it for typo fixes.
    updated: z.coerce.date().optional(),
    // Whether to publicly show the "updated" date next to the published one
    showUpdated: z.boolean().default(false),
    // Freeform tags, lowercase-hyphenated by convention (e.g. "side-project")
    tags: z.array(z.string()).default([]),
    // Keeps a note out of the homepage list, the archive, and getStaticPaths
    // until you're ready - set to false (or remove it) to publish
    draft: z.boolean().default(false),
  }),
});

export const collections = { notes };
