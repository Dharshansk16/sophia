import { getKGRelations, KGFact } from "./knowledge-graph";
import { searchVectorDB } from "./vectorDb";

export type AIContext = {
  llmContext: string;
  kgFacts: string[];
};

// Context for LLM response (KG + Vector DB)
export async function fetchContextForAI(
  userQuery: string,
  personaId: string | null
): Promise<AIContext> {
  // --- Run KG fetch and vector search in parallel ---
  const [kgFacts, vectorChunks] = await Promise.all([
    getKGRelations(userQuery, personaId ?? ""),
    searchVectorDB(userQuery, { topK: 5, personaId }),
  ]);

  // --- Process KG facts ---
  const limitedKGFacts = kgFacts.slice(0, 12);
  const kgHints = limitedKGFacts.map(
    (f) => `${f.subject} ${relationToText(f.relation)} ${f.object}`
  );

  // --- Format vector chunks with citations ---
  const formattedChunks = vectorChunks
    .map(
      (c, i) =>
        `Chunk ${i + 1}:\n${c.text}\n(Source: ${
          c.source ?? "unknown"
        }, Score: ${c.score.toFixed(3)})`
    )
    .join("\n\n");

  // --- Format KG relations ---
  const formattedKG = kgHints.length
    ? `Relations (max 12):\n- ${kgHints.join("\n- ")}`
    : "";

  // --- Final LLM context ---
  const llmContext = `Relevant Chunks:\n${formattedChunks}\nRelevant Relations From Knowledge Graph:\n${formattedKG}`;

  return {
    llmContext,
    kgFacts: kgHints,
  };
}

// helper: map KG symbolic relation to natural language
function relationToText(rel: string): string {
  const mapping: Record<string, string> = {
    HAS: "includes",
    PART_OF: "is part of",
    DESCRIBES: "describes",
    RELATES_TO: "relates to",
  };
  return mapping[rel] || rel.toLowerCase();
}
