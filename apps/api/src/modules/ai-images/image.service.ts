import OpenAI from 'openai';
import { eq } from 'drizzle-orm';
import type { DB } from '../../db/index.js';
import { words } from '../../db/schema/index.js';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

export async function generateWordImage(db: DB, wordId: string): Promise<string | null> {
  const word = await db.query.words.findFirst({ where: eq(words.id, wordId) });
  if (!word) return null;
  if (word.imageUrl) return word.imageUrl;

  const prompt =
    `Minimalist line art illustration of "${word.french}" (${word.translation}). ` +
    `Clean black lines on pure white background, simple flat design, ` +
    `single centered object or concept, no text, no shading, no color fills. ` +
    `Style: simple icon illustration.`;

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'url',
    });

    const imageUrl = response.data?.[0]?.url;
    if (!imageUrl) return null;

    // Save URL to DB (DALL-E URLs expire after 1h — in production use R2)
    await db
      .update(words)
      .set({ imageUrl, imageGenerating: false })
      .where(eq(words.id, wordId));

    return imageUrl;
  } catch (err) {
    console.error('DALL-E error:', err);
    await db
      .update(words)
      .set({ imageGenerating: false })
      .where(eq(words.id, wordId));
    return null;
  }
}
