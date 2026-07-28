import Anthropic from '@anthropic-ai/sdk';

export class AiUnavailableError extends Error {}

export interface AiFoodEstimate {
  name: string;
  estimatedGrams: number;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  confidence: 'low' | 'medium' | 'high';
}

// Model is configureerbaar; default is claude-sonnet-5 — sterker in het redeneren
// over porties en voedingswaarde dan het oude claude-haiku-4-5, wat de accuratesse
// van de schatting merkbaar verbetert.
// Let op: `||` i.p.v. `??` — een lege string in .env (CALCOUNT_AI_MODEL=) moet ook
// terugvallen op de default, niet als "gezet" tellen.
const MODEL = process.env.CALCOUNT_AI_MODEL || 'claude-sonnet-5';

// Losse, optionele override specifiek voor fotoherkenning: valt terug op MODEL
// als niet gezet. Kan los worden opgehoogd (bijv. claude-opus-4-8) zonder de
// tekstschatting te raken.
const PHOTO_MODEL = process.env.CALCOUNT_AI_PHOTO_MODEL || MODEL;

// Redeneren staat expliciet UIT. Sonnet 5 zet adaptief redeneren standaard aan als
// je het `thinking`-veld weglaat, maar dat bleek in productie niet samen te gaan met
// structured outputs (`output_config.format`) — de analyse faalde. Met `disabled`
// volgt de call exact hetzelfde, beproefde pad als voorheen, nu op een sterker model.
const THINKING = { type: 'disabled' } as const;

const ESTIMATE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Korte naam van het gerecht/voedingsmiddel' },
    estimatedGrams: { type: 'number', description: 'Geschatte portiegrootte in gram' },
    calories: { type: 'number', description: 'Geschatte totale calorieën (kcal) voor deze portie' },
    protein: { type: 'number' },
    carbs: { type: 'number' },
    fat: { type: 'number' },
    fiber: { type: 'number' },
    confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: ['name', 'estimatedGrams', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'confidence'],
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

function normalizeItems(items: AiFoodEstimate[]): AiFoodEstimate[] {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new Error('AI gaf een ongeldig aantal items terug');
  }
  const nonNegative = (value: number, decimals = 1) => {
    if (!Number.isFinite(value)) throw new Error('AI gaf een ongeldige voedingswaarde terug');
    const factor = 10 ** decimals;
    return Math.round(Math.max(0, value) * factor) / factor;
  };
  return items.map((item) => ({
    name: item.name.trim() || 'Onbekend item',
    estimatedGrams: nonNegative(item.estimatedGrams, 0),
    calories: nonNegative(item.calories, 0),
    protein: nonNegative(item.protein ?? 0),
    carbs: nonNegative(item.carbs ?? 0),
    fat: nonNegative(item.fat ?? 0),
    fiber: nonNegative(item.fiber ?? 0),
    confidence: item.confidence,
  }));
}

/** Analyseert tekst, foto of beide. De afbeelding leeft alleen in deze request. */
export async function analyzeFood(input: {
  description?: string;
  base64Image?: string;
  mediaType?: PhotoMediaType;
}): Promise<AiPhotoEstimate> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiUnavailableError('AI-analyse is niet geconfigureerd (geen API-sleutel)');
  }
  const description = input.description?.trim() ?? '';
  const hasImage = Boolean(input.base64Image && input.mediaType);
  if (!description && !hasImage) throw new Error('Tekst of foto is verplicht');

  const instruction =
    'Analyseer het eten en schat per afzonderlijk gerecht/product de portiegrootte, ' +
    'calorieën, eiwit, koolhydraten, vet en vezels. Geef meerdere items apart terug. ' +
    'Gebruik eventuele tekst als aanvullende context bij de foto en wees eerlijk over ' +
    'onzekerheid via confidence.' +
    (description ? ` Aanvullende omschrijving: "${description}"` : '');

  const client = new Anthropic();
  const content = hasImage
    ? [
        {
          type: 'image' as const,
          source: {
            type: 'base64' as const,
            media_type: input.mediaType!,
            data: input.base64Image!,
          },
        },
        { type: 'text' as const, text: instruction },
      ]
    : instruction;
  const response = await client.messages.create({
    model: hasImage ? PHOTO_MODEL : MODEL,
    max_tokens: 1536,
    thinking: THINKING,
    output_config: { format: { type: 'json_schema', schema: PHOTO_ESTIMATE_SCHEMA } },
    messages: [{ role: 'user', content }],
  });
  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('Onverwacht AI-antwoord');
  const parsed = JSON.parse(textBlock.text) as AiPhotoEstimate;
  return { items: normalizeItems(parsed.items) };
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
    thinking: THINKING,
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
    fiber: parsed.fiber,
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
    max_tokens: 1536,
    thinking: THINKING,
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
      fiber: item.fiber,
      confidence: item.confidence,
    })),
  };
}
