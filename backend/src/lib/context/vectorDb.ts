import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { embeddingsClient } from "../azure/embeddings-client";

// ---------- TYPES ----------
export type VectorChunk = {
  id: string;
  text: string;
  score: number;
  source?: string;
};

type SearchOptions = {
  topK?: number;
  personaId?: string | null;
};

// ---------- AZURE SEARCH CLIENT ----------
const searchClient = new SearchClient(
  process.env.AZURE_SEARCH_ENDPOINT ?? "",
  process.env.AZURE_SEARCH_INDEX_NAME ?? "",
  new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY ?? "")
);

// ---------- VECTOR SEARCH FUNCTION ----------
export async function searchVectorDB(
  query: string,
  options: SearchOptions = {}
): Promise<VectorChunk[]> {
  const { topK = 5, personaId = null } = options;

  // Get query embedding
  const queryVector = await embeddingsClient.embedQuery(query);

  // Build Azure Search request
  const searchRequest: any = {
    vector: {
      value: queryVector,
      k: topK,
      fields: "vector",
      algorithm: "hnsw",
    },
    filter: personaId ? `personaId eq '${personaId}'` : undefined,
    select: ["id", "content", "pdfUrl"],
    top: topK,
  };

  // Execute search
  const results = await searchClient.search("*", searchRequest);

  // Map results to VectorChunk
  const chunks: VectorChunk[] = [];
  for await (const r of results.results) {
    const doc = r.document as { id: string; content: string; pdfUrl?: string };
    chunks.push({
      id: doc.id,
      text: doc.content,
      score: r.score ?? 0,
      source: doc.pdfUrl,
    });
  }

  return chunks;
}
