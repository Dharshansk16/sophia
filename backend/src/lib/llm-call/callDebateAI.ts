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

You are engaged in a debate. Follow these rules strictly:
1. Respond in the unique style, tone, and worldview of the persona.
2. Do NOT invent facts or hallucinate; only use information available in the provided context.
3. Focus on counter-arguments and defending your position.
4. Keep responses concise, persuasive, and under 200 words.
5. If the context does not provide enough information, clearly state that you cannot answer instead of guessing.
6. Maintain a debate tone, logical reasoning, and clarity.
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
    temperature: 1, // Lower temperature to reduce hallucinations
    azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
    azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_API_INSTANCE_NAME,
    azureOpenAIApiDeploymentName:
      process.env.AZURE_OPENAI_API_GPT_DEPLOYMENT_NAME,
    azureOpenAIApiVersion: process.env.AZURE_OPENAI_API_VERSION,
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
