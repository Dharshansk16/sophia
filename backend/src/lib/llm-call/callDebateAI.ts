import { prisma } from "@/lib/prisma";
import { AzureChatOpenAI } from "@langchain/openai";
import {
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export type DebateAIRequest = {
  previousMessage: string;
  context: string;
  personaId: string;
};

export type AIResponse = {
  answer: string;
  sources: { url?: string; score?: string }[];
};

export async function callDebateAI({
  previousMessage,
  context,
  personaId,
}: DebateAIRequest): Promise<AIResponse> {
  // --- Fetch persona info ---
  const persona = await prisma.persona.findUnique({
    where: { id: personaId },
    select: { name: true, shortBio: true },
  });

  const personaName = persona?.name ?? "Debater";
  const personaStyle = persona
    ? `You are ${persona.name}, a historical figure. 
Speak and respond in their unique style, tone, and worldview. 
Persona description: ${persona.shortBio}`
    : "You are a debater, speaking in a structured, persuasive manner.";

  // --- Build debate prompt ---
  const promptTemplate = ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(`
${personaStyle}

You are engaged in a debate. Your goal is to respond to your opponent's message with:
1. Counter-arguments where applicable.
2. Keep the answer short and concise.
3. Reasoned points supporting your own stance.
4. Maintain a debate tone and be persuasive.
5. Use context (chunks + KG) if relevant.
6. Keep responses concise (under 200 words).
7. Do not invent facts outside the provided context.
`),
    HumanMessagePromptTemplate.fromTemplate(`
Opponent's Message:
{previousMessage}

Your Context:
{context}

Your Response:`),
  ]);

  const chatModel = new AzureChatOpenAI({
    model: "gpt-5-nano",
    temperature: 1,
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName:
      process.env.AZURE_OPENAI_API_GPT_DEPLOYMENT_NAME, // In Node.js defaults to process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION, // In Node.js defaults to process.env.AZURE_OPENAI_API_VERSION
  });
  const chain = RunnableSequence.from([
    promptTemplate,
    chatModel,
    new StringOutputParser(),
  ]);

  // --- Invoke AI ---
  let rawText = "";
  try {
    rawText = await chain.invoke({ previousMessage, context });
  } catch (err) {
    console.error("Debate AI failed:", err);
    rawText = "Unable to generate a debate response.";
  }

  return { answer: rawText.trim(), sources: [] };
}
