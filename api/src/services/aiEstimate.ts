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

// Model is configureerbaar; default volgt de Claude-API-richtlijn.
// Zet CALCOUNT_AI_MODEL=claude-haiku-4-5 voor lagere kosten (zie architecture §5).
const MODEL = process.env.CALCOUNT_AI_MODEL ?? 'claude-opus-4-8';

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
