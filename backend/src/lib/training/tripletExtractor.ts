import { z } from "zod";
import pLimit from "p-limit";
import { AzureChatOpenAI } from "@langchain/openai";

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
  const llm = new AzureChatOpenAI({
    model: "gpt-5-nano",
    temperature: 1,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName:
      process.env.AZURE_OPENAI_API_GPT_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  });

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

 IMPORTANT: Output ONLY valid JSON in this format:
{
  "triplets": [
    { "subject": "Entity1", "predicate": "relation", "object": "Entity2" },
    { "subject": "Entity3", "predicate": "relation", "object": "Entity4" }
  ]
}

Rules:
1. Only include factual, significant relationships.
2. Avoid trivial predicates like "is", "has", "does".
3. Keep each field concise (1–5 words).
4. Prefer proper nouns or technical terms.
5. No duplicates.
6. Do NOT include explanations, only JSON.

Persona ID: ${personaId ?? "none"}
Text:
"""${combined}"""
`;

          const response = await llm.invoke(prompt);

          let triplets: Triplet[] = [];

          try {
            // Try parsing as JSON
            const parsed = schema.safeParse(
              typeof response.content === "string"
                ? JSON.parse(response.content)
                : response.content
            );

            if (parsed.success) {
              triplets = parsed.data.triplets;
            } else {
              console.warn("Triplet schema validation failed:", parsed.error);

              // Fallback: parse free-text "A - B - C"
              const rawText =
                typeof response.content === "string"
                  ? response.content
                  : JSON.stringify(response.content);

              triplets = rawText
                .split("\n")
                .map((line) => line.split("-").map((s) => s.trim()))
                .filter((parts) => parts.length === 3)
                .map(([subject, predicate, object]) => ({
                  subject,
                  predicate,
                  object,
                }));
            }
          } catch (e) {
            console.warn("Failed to parse triplet response:", e);
          }

          // Post-process cleanup
          const cleanedTriplets = triplets.map((t: Triplet) => ({
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
          console.warn(`Triplet extraction failed for batch ${idx + 1}:`, err);
        }
      })
    )
  );

  console.log(
    `4. Triplet extraction finished: ${allTriplets.length} total triplets from ${completed}/${batches.length} batches`
  );

  return allTriplets;
}
