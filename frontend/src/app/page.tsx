import Hero from '@/components/Hero';

export type Persona = {
  id: string
  name: string
  field: string
  era: string
  avatar: string
  description: string
  color: string
}

export type ChatMessage = {
  id: string
  content: string
  sender: "user" | "persona"
  timestamp: Date
  citations?: string[]
}

export default function Home() {
  return (
    <div>
      <Hero />
    </div>
  );
}