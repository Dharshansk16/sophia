import { driver } from "../neo4j/neo4j";
import { removeStopwords } from "stopword";

export type KGFact = {
  subject: string;
  subjectLabels: string[];
  relation: string;
  object: string;
  objectLabels: string[];
};

// Extract keywords from query
function extractKeywords(statement: string): string[] {
  const words = statement
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  return removeStopwords(words);
}

// Fetch KG relations based on English query + personaId filter on relationships
export async function getKGRelations(
  statement: string,
  personaId: string
): Promise<KGFact[]> {
  const session = driver.session();
  try {
    const keyWords = extractKeywords(statement);
    console.log("Extracted keywords:", keyWords);
    if (keyWords.length === 0) return [];

    // build keyword search clauses
    const whereClauses = [
      "ANY(word IN $keyWords WHERE ANY(prop IN keys(s) WHERE toLower(toString(s[prop])) CONTAINS word))",
      "ANY(word IN $keyWords WHERE ANY(prop IN keys(o) WHERE toLower(toString(o[prop])) CONTAINS word))",
      "ANY(word IN $keyWords WHERE toLower(type(r)) CONTAINS word)",
    ];

    const cypher = `
      MATCH (s)-[r]->(o)
      WHERE r.personaId = $personaId AND (${whereClauses.join(" OR ")})
      RETURN 
        s.name AS subject, labels(s) AS subjectLabels,
        type(r) AS relation,
        o.name AS object, labels(o) AS objectLabels
      LIMIT 100
    `;

    const result = await session.run(cypher, { keyWords, personaId });

    return result.records.map((r: any) => ({
      subject: r.get("subject"),
      subjectLabels: r.get("subjectLabels"),
      relation: r.get("relation"),
      object: r.get("object"),
      objectLabels: r.get("objectLabels"),
    }));
  } finally {
    await session.close();
  }
}
