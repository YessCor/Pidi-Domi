import type { Product } from '../types';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const GEMINI_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL ?? 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export interface VoiceOrderItem {
  product: Product;
  quantity: number;
}

export interface VoiceOrderResult {
  transcript: string;
  items: VoiceOrderItem[];
  /** Cosas que el cliente pidió y no existen en el catálogo */
  unmatched: string[];
}

interface RawGeminiOrder {
  transcript?: string;
  items?: { product_id: string; quantity: number }[];
  unmatched?: string[];
}

/** Convierte un archivo local (URI de grabación) a base64 puro (sin prefijo data:). */
export async function audioUriToBase64(uri: string): Promise<string> {
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el audio'));
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

/**
 * Envía el audio a Gemini junto con el catálogo y devuelve los productos identificados.
 * @param audioBase64  audio en base64 (sin prefijo)
 * @param storeProducts catálogo contra el que se debe hacer el match
 * @param mimeType      mime del audio (m4a de expo-audio => 'audio/mp4'; también soporta audio/wav, audio/mp3, audio/aac)
 */
export async function processVoiceOrder(
  audioBase64: string,
  storeProducts: Product[],
  mimeType = 'audio/mp4'
): Promise<VoiceOrderResult> {
  if (!GEMINI_API_KEY) throw new Error('Falta EXPO_PUBLIC_GEMINI_API_KEY en .env');
  if (storeProducts.length === 0) throw new Error('No hay productos en el catálogo');

  const catalog = storeProducts.map((p) => ({ id: p.id, name: p.name, description: p.description }));

  const prompt = `Eres el asistente de pedidos de una app de domicilios en Colombia.
Escucha el audio del cliente y extrae lo que quiere pedir.
Haz match ÚNICAMENTE contra este catálogo (usa el "id" exacto):
${JSON.stringify(catalog)}

Reglas:
- "quantity" es un entero >= 1. Si no dice cantidad, asume 1.
- Si el cliente pide algo que no está en el catálogo, ponlo en "unmatched" (texto corto).
- "transcript" es la transcripción literal del audio.
- Responde SOLO con el JSON del esquema.`;

  const body = {
    contents: [
      {
        parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: audioBase64 } }],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          transcript: { type: 'STRING' },
          items: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { product_id: { type: 'STRING' }, quantity: { type: 'INTEGER' } },
              required: ['product_id', 'quantity'],
            },
          },
          unmatched: { type: 'ARRAY', items: { type: 'STRING' } },
        },
        required: ['transcript', 'items', 'unmatched'],
      },
    },
  };

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini no devolvió contenido');

  const raw: RawGeminiOrder = JSON.parse(text.replace(/```json|```/g, '').trim());
  const byId = new Map(storeProducts.map((p) => [p.id, p]));
  const unmatched = [...(raw.unmatched ?? [])];

  // Consolida duplicados y descarta ids inventados por el modelo
  const acc = new Map<string, VoiceOrderItem>();
  for (const it of raw.items ?? []) {
    const product = byId.get(it.product_id);
    if (!product) {
      unmatched.push(it.product_id);
      continue;
    }
    const qty = Math.max(1, Math.round(it.quantity || 1));
    const prev = acc.get(product.id);
    acc.set(product.id, { product, quantity: (prev?.quantity ?? 0) + qty });
  }

  return { transcript: raw.transcript ?? '', items: [...acc.values()], unmatched };
}
