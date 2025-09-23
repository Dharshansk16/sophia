import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import pLimit from "p-limit";

// ---------- TYPES ----------
export type Triplet = {
  subject: string;
  predicate: string;
  object: string;
};

// ---------- BATCH EXTRACTOR ----------
export async function extractTripletsWithGemini(
  texts: string[],
  personaId: string | null,
  batchSize = 10,
  concurrency = 5
): Promise<Triplet[]> {
  console.log(
    `\n=== 1. Triplet Extraction Started (${texts.length} chunks) ===`
  );

  // Schema for structured output
  const schema = z.object({
    triplets: z.array(
      z.object({
        subject: z.string(),
        predicate: z.string(),
        object: z.string(),
      })
    ),
  });

  // Initialize model
  const chatModel = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: "gemini-2.5-flash",
    temperature: 0,
  }).withStructuredOutput(schema);

  // Split texts into batches
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }
  console.log(`2. Created ${batches.length} batches (batchSize=${batchSize})`);

  const limit = pLimit(concurrency);
  const allTriplets: Triplet[] = [];
  let completed = 0;

  await Promise.allSettled(
    batches.map((batch, idx) =>
      limit(async () => {
        try {
          const combined = batch.join("\n---\n");

          const prompt = `
Extract short, meaningful subject-predicate-object (S-P-O) triplets from the following text.
Rules:
1. Only include factual, significant relationships conveying real information.
2. Avoid generic, trivial, or obvious predicates like "is", "has", "does", or "relationship".
3. Keep each subject, predicate, and object concise (1–5 words if possible).
4. Prefer proper nouns, named entities, or technical terms as subjects and objects.
5. Infer meaningful predicates even if none is explicitly present.
6. Avoid duplicates or repeated concepts.
7. Focus on relationships that matter for knowledge representation.

Persona ID: ${personaId ?? "none"}
Text:
"""${combined}"""
`;

          const response = await chatModel.invoke(prompt);

          // Post-process to replace empty or generic predicates
          const cleanedTriplets = response.triplets.map((t: Triplet) => ({
            subject: t.subject.trim(),
            predicate:
              !t.predicate || t.predicate.toLowerCase() === "relationship"
                ? "relates to"
                : t.predicate.trim(),
            object: t.object.trim(),
          }));

          allTriplets.push(...cleanedTriplets);

          completed++;
          console.log(
            `3. Triplet batch ${idx + 1}/${batches.length} completed (${
              cleanedTriplets.length
            } triplets)`
          );
        } catch (err) {
          console.warn(
            `⚠️ Triplet extraction failed for batch ${idx + 1}:`,
            err
          );
        }
      })
    )
  );

  console.log(
    `4. Triplet extraction finished: ${allTriplets.length} total triplets from ${completed}/${batches.length} batches`
  );

  return allTriplets;
}
