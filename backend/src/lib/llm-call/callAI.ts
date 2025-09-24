import { prisma } from "@/lib/prisma";
import { AzureChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export type AIRequest = {
  prompt: string;
  context: string; // raw text with chunks + KG relations
  personaId?: string | null;
};

export type AIResponse = {
  answer: string;
  sources: { url?: string; score?: string }[];
};

export default async function callAI({
  prompt,
  context,
  personaId,
}: AIRequest): Promise<AIResponse> {
  // --- 1. Fetch persona info ---
  let personaName = "Assistant";
  let personaStyle = "You are a helpful assistant.";

  if (personaId) {
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
      select: { name: true, shortBio: true },
    });

    if (persona) {
      personaName = persona.name;
      personaStyle = `You are ${persona.name}, a historical figure. 
Speak and respond in their unique style, tone, and worldview. 
Persona description: ${persona.shortBio}`;
    }
  }

  // --- 2. Create enhanced prompt template ---
  const promptTemplate = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`
${personaStyle}

You are provided with a "Retrieved Context" to help answer the user's question. The context may include:
- Textual chunks from sources
- Knowledge graph relations

Important Rules:
1. Use context to answer the question. Summarize relevant information in a concise and structured manner.
2. Only say "Answer not in context" if there is truly nothing relevant in the context.
3. Do NOT invent facts outside the context.
4. Try to answer in a concise manner, ideally under 200 words.
5. Maintain persona's unique style, tone, and worldview.
6. KG relations may inform your reasoning but do not mention or cite them.
7. At the end of your response, list only the URLs you used to generate the answer, between these markers:

[SOURCES_USED_START]
<url1>
<url2>
...
[SOURCES_USED_END]
`),
    HumanMessagePromptTemplate.fromTemplate(`
User Question: {question}

Retrieved Context:
{context}
`),
  ]);

  // --- 3. Initialize AzureChatOpenAI ---
  const chatModel = new AzureChatOpenAI({
    model: "gpt-5-nano",
    temperature: 1,
    maxTokens: undefined,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName:
      process.env.AZURE_OPENAI_API_GPT_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
  });

  // --- 4. Build RunnableSequence ---
  const chain = RunnableSequence.from([
    promptTemplate,
    chatModel,
    new StringOutputParser(),
  ]);

  // --- 5. Debug logging ---
  console.log("=== AI Request Debug ===");
  console.log("User Question:", prompt);
  console.log("Retrieved Context:", context);

  // --- 6. Invoke chain with error handling ---
  let rawText = "";
  try {
    rawText = await chain.invoke({
      question: prompt,
      context,
    });
  } catch (err) {
    console.error("AI chain invocation failed:", err);
  }

  // --- 7. Ensure non-empty answer ---
  rawText = rawText?.trim();
  if (!rawText) rawText = "Answer not in context";

  // --- 8. Extract all possible sources from context ---
  const sourceRegex =
    /\(Source:\s*(https?:\/\/[^\s,]+),\s*Score:\s*([\d.]+)\)/gi;

  const uniqueSources = new Map<string, { url: string; score: string }>();
  let match;
  while ((match = sourceRegex.exec(context)) !== null) {
    const url = match[1].trim();
    const score = match[2].trim();
    if (!uniqueSources.has(url)) {
      uniqueSources.set(url, { url, score });
    }
  }

  // --- 9. Extract sources actually used (from model output) ---
  const sourceUsedRegex =
    /\[SOURCES_USED_START\]([\s\S]*?)\[SOURCES_USED_END\]/i;
  const usedSourcesMatch = rawText.match(sourceUsedRegex);

  let sourcesArray: { url?: string; score?: string }[] = [];
  let finalAnswer = rawText;

  if (usedSourcesMatch) {
    const usedUrls = usedSourcesMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => !!line);

    sourcesArray = usedUrls
      .filter((url) => uniqueSources.has(url))
      .map((url) => uniqueSources.get(url)!);

    // Remove the [SOURCES_USED_START] ... [SOURCES_USED_END] block from answer
    finalAnswer = rawText.replace(sourceUsedRegex, "").trim();
  }

  // --- 10. Add formatted sources only if present and answer is not "not in context" ---
  if (!/answer not in context/i.test(finalAnswer) && sourcesArray.length > 0) {
    finalAnswer += `\n\n**Sources**\n${sourcesArray
      .map(
        (source, index) =>
          `${index + 1}. [${source.url}] (Score: ${source.score})`
      )
      .join("\n")}`;
  }

  return {
    answer: finalAnswer,
    sources: sourcesArray,
  };
}
