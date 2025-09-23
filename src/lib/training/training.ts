import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";
import { Session } from "neo4j-driver";
import { driver as neo4jDriver } from "../neo4j/neo4j";
import { embeddingsClient } from "../azure/embeddings-client";
import { extractTripletsWithGemini, Triplet } from "./tripletExtractor";

// ---------- TYPES ----------
export type TrainingDocument = {
  id: string;
  content: string;
  vector: number[];
  personaId: string | null;
  pdfUrl: string;
  uploadId: string;
  pageNumber: number | null;
  chunkIndex: number;
};

// ---------- CLIENTS ----------
const searchClient = new SearchClient<TrainingDocument>(
  process.env.AZURE_SEARCH_ENDPOINT ?? "",
  process.env.AZURE_SEARCH_INDEX_NAME ?? "",
  new AzureKeyCredential(process.env.AZURE_SEARCH_API_KEY ?? "")
);

// ---------- HELPERS ----------
async function retry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(` Retry ${i + 1}/${retries} failed: ${err}`);
      await new Promise((res) => setTimeout(res, delay * (i + 1)));
    }
  }
  throw lastError;
}

function logStage(message: string) {
  console.log(`\n=== 1. ${message} ===`);
}

function logProgress(current: number, total: number, stage: string) {
  console.log(`${stage}: batch ${current} of ${total} completed`);
}

function logSuccess(message: string) {
  console.log(`${message}`);
}

// ---------- MAIN FUNCTION ----------
export async function trainPdfHybridNeo4j(
  file: File,
  uploadId: string,
  personaId: string | null,
  pdfUrl: string
): Promise<void> {
  let session: Session | null = null;
  const startTime = Date.now();

  try {
    // ---------- Load PDF & Chunk ----------
    logStage("Loading and chunking PDF");

    const loader = new PDFLoader(file, { splitPages: true });
    const docs = await loader.load();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });

    const chunkedDocs: TrainingDocument[] = [];
    for (const doc of docs) {
      const chunks = await splitter.splitText(doc.pageContent);
      chunks.forEach((content, i) => {
        chunkedDocs.push({
          id: `${uploadId}-${doc.metadata.page}-${i}`,
          content,
          vector: [],
          personaId,
          pdfUrl,
          uploadId,
          pageNumber: doc.metadata.page ?? null,
          chunkIndex: i,
        });
      });
    }

    logSuccess(`PDF split into ${chunkedDocs.length} chunks`);

    // ---------- Generate Embeddings ----------
    logStage("Generating embeddings");

    const EMBEDDING_BATCH = 50;
    const totalEmbeddingBatches = Math.ceil(
      chunkedDocs.length / EMBEDDING_BATCH
    );

    for (let i = 0; i < chunkedDocs.length; i += EMBEDDING_BATCH) {
      const batch = chunkedDocs.slice(i, i + EMBEDDING_BATCH);
      const vectors = await retry(() =>
        embeddingsClient.embedDocuments(batch.map((d) => d.content))
      );
      batch.forEach((d, j) => {
        d.vector = vectors[j];
      });

      logProgress(
        Math.floor(i / EMBEDDING_BATCH) + 1,
        totalEmbeddingBatches,
        "Embeddings"
      );
    }

    // ---------- Extract Triplets ----------
    logStage("Extracting triplets with Gemini");

    const texts = chunkedDocs.map((d) => d.content);
    const allTriplets: Triplet[] = await extractTripletsWithGemini(
      texts,
      personaId,
      10,
      5
    );

    logSuccess(`Extracted ${allTriplets.length} triplets`);

    // ---------- Upload to Azure Search ----------
    logStage("Uploading embeddings to Azure Search");
    await retry(() => searchClient.uploadDocuments(chunkedDocs));
    logSuccess(`Uploaded ${chunkedDocs.length} documents to Azure Search`);

    // ---------- Upload to Neo4j ----------
    logStage("Uploading triplets to Neo4j");
    session = neo4jDriver.session();

    const query = `
      UNWIND $triplets AS triplet
      MERGE (s:Entity {name: triplet.subject, personaId: $personaId})
      MERGE (o:Entity {name: triplet.object, personaId: $personaId})
      MERGE (s)-[r:RELATIONSHIP {type: triplet.predicate, personaId: $personaId}]->(o)
    `;

    await retry(() =>
      session!.run(query, { triplets: allTriplets, personaId })
    );

    logSuccess(
      `Inserted ${allTriplets.length} triplets into Neo4j for persona ${personaId}`
    );

    // ---------- Finished ----------
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logSuccess(`Hybrid training completed for ${uploadId} in ${duration}s`);
  } catch (err) {
    console.error(`Hybrid training failed for upload ${uploadId}:`, err);
  } finally {
    await session?.close();
  }
}
