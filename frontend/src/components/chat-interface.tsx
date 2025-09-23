"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Mic, Paperclip } from "lucide-react"
import type { Persona, ChatMessage } from "@/app/page"

interface ChatInterfaceProps {
  persona: Persona
}

export function ChatInterface({ persona }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: `Greetings! I am ${persona.name}. I'm delighted to engage in discourse with you about the mysteries of ${persona.field.toLowerCase()} and the nature of our universe. What questions burn in your curious mind?`,
      sender: "persona",
      timestamp: new Date(),
      citations: ["Historical Records", "Scientific Papers"],
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsTyping(true)

    // Simulate persona response
    setTimeout(() => {
      const responses = [
        `Ah, a fascinating inquiry! In my studies of ${persona.field.toLowerCase()}, I have observed that...`,
        `Your question touches upon the very essence of what I dedicated my life to understanding...`,
        `Indeed, this reminds me of my work on the fundamental principles that govern...`,
        `An excellent point! Allow me to share my perspective based on years of research...`,
      ]

      const personaMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          responses[Math.floor(Math.random() * responses.length)] +
          " The interconnectedness of all natural phenomena continues to astound me, even in this digital realm where we now converse.",
        sender: "persona",
        timestamp: new Date(),
        citations: ["Research Notes", "Published Works"],
      }

      setMessages((prev) => [...prev, personaMessage])
      setIsTyping(false)
    }, 2000)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-full">
      {/* Chat header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-3 md:p-4 flex items-center gap-4 flex-shrink-0">
        <img
          src={persona.avatar || "/placeholder.svg"}
          alt={persona.name}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold font-[family-name:var(--font-playfair)] text-base md:text-lg truncate">{persona.name}</h3>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {persona.field}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {persona.era}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <Card
              className={`w-fit ${
                message.sender === "user"
                  ? "max-w-[75%] md:max-w-[60%] bg-primary text-primary-foreground"
                  : "max-w-[85%] md:max-w-[75%] bg-card border-2 border-border shadow-md"
              }`}
            >
              <CardContent className={`${message.sender === "user" ? "p-2 md:p-3" : "p-3 md:p-4"}`}>
                <div className={`text-sm leading-relaxed break-words ${message.sender === "persona" ? "typewriter" : ""}`}>
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
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <Card className="bg-card border-2 border-border">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-sm text-muted-foreground">{persona.name} is contemplating...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-3 md:p-4 flex-shrink-0">
        <div className="flex items-center gap-2 w-full">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share your thoughts with this great mind..."
              className="pr-16 md:pr-20 bg-background/80 border-2 border-border focus:border-primary transition-colors text-sm md:text-base"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button size="sm" variant="ghost" className="h-6 w-6 md:h-8 md:w-8 p-0">
                <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-6 w-6 md:h-8 md:w-8 p-0">
                <Mic className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
          <Button onClick={handleSendMessage} disabled={!inputValue.trim()} className="quill-write flex-shrink-0">
            <Send className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
