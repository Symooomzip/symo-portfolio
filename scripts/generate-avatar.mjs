// Generate a stylized 3D head-only avatar with Nano Banana (Gemini image model).
// Usage: npm run avatar   (requires GOOGLE_API_KEY in .env and selfie.jpg in project root)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

process.loadEnvFile('.env');

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) {
  console.error('GOOGLE_API_KEY missing from .env');
  process.exit(1);
}

// likeness reference: CLI arg > selfie.jpg > the original bust avatar
const SELFIE = process.argv[2] ?? (existsSync('selfie.jpg') ? 'selfie.jpg' : 'public/avatar.png');
if (!existsSync(SELFIE)) {
  console.error(`Reference image ${SELFIE} not found.`);
  process.exit(1);
}
console.log('Using likeness reference:', SELFIE);
const MIME = SELFIE.endsWith('.png') ? 'image/png' : 'image/jpeg';

const MODEL = 'gemini-2.5-flash-image';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `Transform the person in this photo into a stylized 3D animated character portrait, Pixar/DreamWorks style.

STRICT REQUIREMENTS:
- FLOATING HEAD ONLY: crop cleanly just under the jaw and chin. NO neck, NO shoulders, NO body. The head floats alone.
- Pure solid black background (#000000), nothing else in the frame.
- STRONG likeness to the photo: same face shape, same short black curly hair with the exact same hairline, thick dark eyebrows, warm medium skin tone, his mustache connected to a small chin goatee, warm brown eyes, the same friendly confident smile.
- Only slightly stylized proportions: subtly larger expressive eyes, glossy sculpted curls. Keep it recognizable as HIM, not a generic character.
- Soft cinematic studio lighting with a magenta-purple rim light on one side.
- Ultra-detailed 3D render, smooth skin shading, glossy hair material, centered composition, no text, no watermark.`;

function imagePart(path, mimeType) {
  return {
    inline_data: { mime_type: mimeType, data: readFileSync(path).toString('base64') },
  };
}

const body = {
  contents: [
    {
      parts: [
        { text: PROMPT },
        imagePart(SELFIE, MIME),
      ],
    },
  ],
  generationConfig: { responseModalities: ['IMAGE'] },
};

console.log('Calling Nano Banana...');
const res = await fetch(URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
  body: JSON.stringify(body),
});

if (!res.ok) {
  console.error('API error', res.status, await res.text());
  process.exit(1);
}

const data = await res.json();
const parts = data.candidates?.[0]?.content?.parts ?? [];
const img = parts.find((p) => p.inlineData?.data || p.inline_data?.data);
if (!img) {
  console.error('No image in response:', JSON.stringify(data).slice(0, 800));
  process.exit(1);
}

const b64 = img.inlineData?.data ?? img.inline_data?.data;
const out = `avatar-v2-${Date.now()}.png`;
writeFileSync(out, Buffer.from(b64, 'base64'));
console.log('Saved', out);
