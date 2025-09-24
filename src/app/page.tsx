import Hero from "@/components/Hero";
import { type Persona } from "@/lib/api";

export type { Persona };

export type ChatMessage = {
  id: string;
  content: string;
  sender: "user" | "persona";
  timestamp: Date;
  citations?: string[];
};

export default function Home() {
  return (
    <div>
      <Hero />
    </div>
  );
}
