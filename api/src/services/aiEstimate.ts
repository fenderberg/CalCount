import Anthropic from '@anthropic-ai/sdk';

export class AiUnavailableError extends Error {}

export interface AiFoodEstimate {
  name: string;
  estimatedGrams: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  confidence: 'low' | 'medium' | 'high';
}

// Model is configureerbaar; default is claude-haiku-4-5 (PRD v1.1 §9 beslissing 13).
// Let op: `||` i.p.v. `??` — een lege string in .env (CALCOUNT_AI_MODEL=) moet ook
// terugvallen op de default, niet als "gezet" tellen.
const MODEL = process.env.CALCOUNT_AI_MODEL || 'claude-haiku-4-5';

// Losse, optionele override specifiek voor fotoherkenning: valt terug op MODEL
// als niet gezet. Noodgreep naar claude-sonnet-5 als de accuracy-check op foto's
// (Story 3.1 Task 1) tegenvalt, zonder de tekstschatting te raken.
const PHOTO_MODEL = process.env.CALCOUNT_AI_PHOTO_MODEL || MODEL;

const ESTIMATE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Korte naam van het gerecht/voedingsmiddel' },
    estimatedGrams: { type: 'number', description: 'Geschatte portiegrootte in gram' },
    calories: { type: 'number', description: 'Geschatte totale calorieën (kcal) voor deze portie' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: ['name', 'estimatedGrams', 'calories', 'confidence'],
  additionalProperties: false,
} as const;

const PHOTO_ESTIMATE_SCHEMA = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: ESTIMATE_SCHEMA,
    },
  },
  required: ['items'],
  additionalProperties: false,
} as const;

export interface AiPhotoEstimate {
  items: AiFoodEstimate[];
}

/**
 * Schat op basis van een tekstomschrijving de calorieën van een portie.
 * Gooit AiUnavailableError als er geen API-sleutel is geconfigureerd.
 */
export async function estimateFromText(description: string): Promise<AiFoodEstimate> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiUnavailableError('AI-schatting is niet geconfigureerd (geen API-sleutel)');
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    output_config: { format: { type: 'json_schema', schema: ESTIMATE_SCHEMA } },
    messages: [
      {
        role: 'user',
        content:
          'Schat de voedingswaarde van deze portie eten. Geef een realistische ' +
          'schatting van portiegrootte en calorieën; wees eerlijk over onzekerheid ' +
          `via het confidence-veld. Omschrijving: "${description}"`,
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Onverwacht AI-antwoord');
  }
  const parsed = JSON.parse(textBlock.text) as AiFoodEstimate;
  return {
    name: parsed.name,
    estimatedGrams: Math.round(parsed.estimatedGrams),
    calories: Math.round(parsed.calories),
    protein: parsed.protein,
    carbs: parsed.carbs,
    fat: parsed.fat,
    confidence: parsed.confidence,
  };
}

export type PhotoMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const VALID_PHOTO_MEDIA_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

export function isValidPhotoMediaType(value: string): value is PhotoMediaType {
  return VALID_PHOTO_MEDIA_TYPES.includes(value);
}

/**
 * Schat op basis van een foto welk(e) gerecht(en) erop staan en de calorieën.
 * Ondersteunt meerdere herkende items per foto (architecture.md §5).
 * Gooit AiUnavailableError als er geen API-sleutel is geconfigureerd.
 */
export async function estimateFromPhoto(
  base64Image: string,
  mediaType: PhotoMediaType,
): Promise<AiPhotoEstimate> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiUnavailableError('AI-fotoherkenning is niet geconfigureerd (geen API-sleutel)');
  }

  const client = new Anthropic();
  const response = await client.messages.create({
    model: PHOTO_MODEL,
    max_tokens: 1024,
    output_config: { format: { type: 'json_schema', schema: PHOTO_ESTIMATE_SCHEMA } },
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64Image },
          },
          {
            type: 'text',
            text:
              'Herken wat op deze foto van eten staat en schat de voedingswaarde. ' +
              'Als er meerdere afzonderlijke gerechten/producten op de foto staan, geef ' +
              'ze als aparte items terug. Geef een realistische schatting van portiegrootte ' +
              'en calorieën per item; wees eerlijk over onzekerheid via het confidence-veld.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Onverwacht AI-antwoord');
  }
  const parsed = JSON.parse(textBlock.text) as AiPhotoEstimate;
  return {
    items: parsed.items.map((item) => ({
      name: item.name,
      estimatedGrams: Math.round(item.estimatedGrams),
      calories: Math.round(item.calories),
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      confidence: item.confidence,
    })),
  };
}
