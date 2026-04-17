import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY'] });

/**
 * Generate TTS audio using OpenAI TTS-1-HD.
 * Returns a Buffer with the MP3 audio data.
 * In production this should be uploaded to R2 and URL stored in DB.
 */
export async function generateTTS(text: string): Promise<Buffer> {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice: 'alloy',
    input: text,
    response_format: 'mp3',
  });

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
