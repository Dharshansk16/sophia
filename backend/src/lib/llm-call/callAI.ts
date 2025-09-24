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

  // --- 8. Extract sources from context ---
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

  // --- 9. Build final formatted answer ---
  let finalAnswer = rawText;
  let sourcesArray: { url?: string; score?: string }[] = [];

  // ✅ Only attach sources if the response does NOT contain "answer not in context"
  if (!/answer not in context/i.test(rawText) && uniqueSources.size > 0) {
    finalAnswer += `\n\n**Sources**\n${Array.from(uniqueSources.values())
      .map(
        (source, index) =>
          `${index + 1}. [${source.url}] (Score: ${source.score})`
      )
      .join("\n")}`;

    sourcesArray = Array.from(uniqueSources.values());
  }

  return {
    answer: finalAnswer,
    sources: sourcesArray,
  };
}
