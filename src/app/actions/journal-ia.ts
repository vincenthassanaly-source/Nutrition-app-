"use server";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/auth";

const EstimationSchema = z.object({
  kcal: z.number().min(0),
  proteines_g: z.number().min(0),
  glucides_g: z.number().min(0),
  lipides_g: z.number().min(0),
  note: z
    .string()
    .describe(
      "Explique en 1-2 phrases, en français, les hypothèses faites (quantités supposées, ingrédients ambigus)."
    ),
});

export type EstimationRepas = z.infer<typeof EstimationSchema>;

export type EstimationResult =
  | { ok: true; data: EstimationRepas }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `Tu es un nutritionniste expert qui estime les valeurs nutritionnelles d'un repas à partir d'une description en langage naturel, en français.

Règles :
- Estime les macros du repas ENTIER décrit par l'utilisateur, pas pour 100g.
- Si l'utilisateur ne précise pas de quantités, utilise des portions standards usuelles pour un repas d'adulte (ex : ~150g de riz cuit, ~120g de viande/poisson, ~1 avocat moyen ≈ 140g) et indique-le explicitement dans le champ "note".
- Le champ "note" doit toujours expliquer en une ou deux phrases les hypothèses faites (quantités supposées, ingrédients ambigus ou manquants), même quand l'utilisateur a précisé des quantités.
- Base tes estimations sur des données nutritionnelles usuelles (type Ciqual/USDA) et reste réaliste plutôt qu'optimiste.`;

const MAX_DESCRIPTION_LENGTH = 500;
const MAX_ATTEMPTS = 2;

export async function estimateRepasLibre(description: string): Promise<EstimationResult> {
  await requireUser();

  const texte = description.trim();
  if (!texte) {
    return { ok: false, error: "Décris le repas avant de lancer l'estimation." };
  }
  if (texte.length > MAX_DESCRIPTION_LENGTH) {
    return {
      ok: false,
      error: `Description trop longue (${MAX_DESCRIPTION_LENGTH} caractères max).`,
    };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "Estimation IA indisponible : clé API non configurée sur le serveur." };
  }

  const client = new Anthropic({ apiKey });

  let lastError = "Impossible de contacter le service d'estimation IA.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await client.messages.parse({
        model: "claude-opus-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: texte }],
        output_config: {
          format: zodOutputFormat(EstimationSchema),
          effort: "low",
        },
      });

      if (response.parsed_output) {
        return { ok: true, data: response.parsed_output };
      }

      lastError = "L'IA n'a pas pu estimer ce repas, réessaie avec une description plus précise.";
    } catch (err) {
      if (err instanceof Anthropic.AuthenticationError) {
        return { ok: false, error: "Clé API IA invalide côté serveur." };
      }
      if (err instanceof Anthropic.RateLimitError) {
        lastError = "Service IA surchargé, réessaie dans un instant.";
      } else if (err instanceof Anthropic.APIError) {
        lastError = `Erreur du service IA : ${err.message}`;
      } else {
        lastError = "Impossible de contacter le service d'estimation IA.";
      }
    }
  }

  return { ok: false, error: lastError };
}
