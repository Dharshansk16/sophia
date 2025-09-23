"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Play, Square } from "lucide-react"
import type { Persona, ChatMessage } from "@/app/page"

interface DebateInterfaceProps {
  personas: [Persona, Persona]
}

export function DebateInterface({ personas }: DebateInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isDebateActive, setIsDebateActive] = useState(false)
  const [currentSpeaker, setCurrentSpeaker] = useState<0 | 1>(0)
  const [debateTopic, setDebateTopic] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const startDebate = () => {
    if (!debateTopic.trim()) return

    setIsDebateActive(true)
    setMessages([
      {
        id: "1",
        content: `Welcome to this historic debate between ${personas[0].name} and ${personas[1].name} on the topic: "${debateTopic}". Let us begin this intellectual discourse.`,
        sender: "user",
        timestamp: new Date(),
      },
    ])

    // Start the debate with first persona
    setTimeout(() => {
      simulateDebateResponse(0, true)
    }, 1000)
  }

  const simulateDebateResponse = (speakerIndex: 0 | 1, isOpening = false) => {
    const speaker = personas[speakerIndex]
    const opponent = personas[1 - speakerIndex]

    const openingStatements = [
      `Esteemed colleague ${opponent.name}, I must respectfully present my perspective on this matter...`,
      `My dear ${opponent.name}, while I hold great respect for your contributions to ${opponent.field.toLowerCase()}, I believe we must consider...`,
      `Honored ${opponent.name}, your reputation precedes you, yet I find myself compelled to offer a different viewpoint...`,
    ]

    const responses = [
      `I must respectfully disagree with my esteemed colleague's assertion...`,
      `While ${opponent.name} raises interesting points, my research suggests...`,
      `An intriguing perspective, yet I believe the evidence points toward...`,
      `I appreciate ${opponent.name}'s reasoning, however, we must also consider...`,
    ]

    const content = isOpening
      ? openingStatements[Math.floor(Math.random() * openingStatements.length)]
      : responses[Math.floor(Math.random() * responses.length)]

    const message: ChatMessage = {
      id: Date.now().toString(),
      content:
        content +
        ` The fundamental principles of ${speaker.field.toLowerCase()} demonstrate that our understanding must evolve through rigorous examination and discourse.`,
      sender: "persona",
      timestamp: new Date(),
      citations: [`${speaker.name}'s Works`, "Historical Documents"],
    }

    setMessages((prev) => [...prev, message])
    setCurrentSpeaker((1 - speakerIndex) as 0 | 1)

    // Continue debate
    if (isDebateActive && messages.length < 10) {
      setTimeout(() => {
        simulateDebateResponse((1 - speakerIndex) as 0 | 1)
      }, 3000)
    }
  }

  const stopDebate = () => {
    setIsDebateActive(false)
  }

  const handleUserInput = () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")

    // Pause debate for user interaction
    setIsDebateActive(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Debate header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-[family-name:var(--font-playfair)] text-xl">Historical Debate</h3>
          <div className="flex items-center gap-2">
            {!isDebateActive ? (
              <Button onClick={startDebate} disabled={!debateTopic.trim()} size="sm">
                <Play className="h-4 w-4 mr-2" />
                Start Debate
              </Button>
            ) : (
              <Button onClick={stopDebate} variant="destructive" size="sm">
                <Square className="h-4 w-4 mr-2" />
                Stop Debate
              </Button>
            )}
          </div>
        </div>

        {!isDebateActive && messages.length === 0 && (
          <div className="mb-4">
            <Input
              value={debateTopic}
              onChange={(e) => setDebateTopic(e.target.value)}
              placeholder="Enter a debate topic (e.g., 'The nature of time and space')"
              className="bg-background/80 border-2 border-border"
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-8">
          <div
            className={`text-center transition-all ${currentSpeaker === 0 && isDebateActive ? "scale-110 ring-2 ring-primary rounded-lg p-2" : ""}`}
          >
            <img
              src={personas[0].avatar || "/placeholder.svg"}
              alt={personas[0].name}
              className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-border"
            />
            <h4 className="font-semibold text-sm">{personas[0].name}</h4>
            <Badge variant="secondary" className="text-xs mt-1">
              {personas[0].field}
            </Badge>
          </div>

          <div className="text-3xl font-bold text-primary animate-pulse">VS</div>

          <div
            className={`text-center transition-all ${currentSpeaker === 1 && isDebateActive ? "scale-110 ring-2 ring-primary rounded-lg p-2" : ""}`}
          >
            <img
              src={personas[1].avatar || "/placeholder.svg"}
              alt={personas[1].name}
              className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-border"
            />
            <h4 className="font-semibold text-sm">{personas[1].name}</h4>
            <Badge variant="secondary" className="text-xs mt-1">
              {personas[1].field}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isPersona0 = message.sender === "persona" && index % 2 === 1
          const isPersona1 = message.sender === "persona" && index % 2 === 0 && index > 0

          return (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-center" : isPersona0 ? "justify-start" : "justify-end"
              }`}
            >
              <Card
                className={`max-w-[80%] scroll-unfurl ${
                  message.sender === "user"
                    ? "bg-accent text-accent-foreground border-2 border-accent"
                    : isPersona0
                      ? "bg-card border-2 border-primary/30 shadow-md"
                      : "bg-secondary border-2 border-accent/30 shadow-md"
                }`}
              >
                <CardContent className="p-4">
                  {message.sender === "persona" && (
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={isPersona0 ? personas[0].avatar : personas[1].avatar}
                        alt={isPersona0 ? personas[0].name : personas[1].name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-semibold text-sm">{isPersona0 ? personas[0].name : personas[1].name}</span>
                    </div>
                  )}

                  <div className={`text-sm leading-relaxed ${message.sender === "persona" ? "typewriter" : ""}`}>
                    {message.content}
                  </div>

                  {message.citations && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.citations.map((citation, index) => (
                        <Badge key={index} variant="outline" className="text-xs cursor-pointer hover:bg-accent">
                          [{index + 1}] {citation}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</div>
                </CardContent>
              </Card>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Interject with your own thoughts or questions..."
              className="bg-background/80 border-2 border-border focus:border-primary transition-colors"
            />
          </div>
          <Button onClick={handleUserInput} disabled={!inputValue.trim()} className="quill-write">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
