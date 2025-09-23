"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Play, Square } from "lucide-react";
import { debatesAPI, type Persona } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { FormattedMessage } from "@/lib/message-formatter";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "persona";
  timestamp: Date;
  citations?: string[];
  personaIndex?: 0 | 1;
}

interface DebateInterfaceProps {
  personas: [Persona, Persona];
}

export function DebateInterface({ personas }: DebateInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isDebateActive, setIsDebateActive] = useState(false);
  const [debateTopic, setDebateTopic] = useState("");
  const [debateId, setDebateId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastPersonaIndex, setLastPersonaIndex] = useState<0 | 1>(1); // start with 1 so first reply is persona[0]

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startDebate = async () => {
    if (!debateTopic.trim() || !user) {
      toast.error("Please enter a debate topic and ensure you're logged in");
      return;
    }

    setIsLoading(true);
    try {
      // ------------------ FIX HERE ------------------
      // Pass just an array of persona IDs
      const participantIds = [personas[0].id, personas[1].id];

      const debate = await debatesAPI.create(
        debateTopic,
        participantIds, // backend now expects array of strings
        user.id
      );
      setDebateId(debate.id);
      setIsDebateActive(true);

      // Initial system message
      const initialMessage: ChatMessage = {
        id: "init-1",
        content: `Welcome to this debate between ${personas[0].name} and ${personas[1].name} on the topic: "${debateTopic}". Let's begin.`,
        sender: "user",
        timestamp: new Date(),
      };
      setMessages([initialMessage]);

      // Kickoff debate
      const startingPrompt = `Begin a debate on the topic: "${debateTopic}". ${personas[0].name}, please present your opening statement. ${personas[1].name} will respond next.`;

      const response = await debatesAPI.sendMessage(debate.id, startingPrompt);

      if (response.aiMessage) {
        const aiMessage: ChatMessage = {
          id: response.aiMessage.id || `ai-${Date.now()}`,
          content: response.aiMessage.content,
          sender: "persona",
          timestamp: new Date(response.aiMessage.createdAt || Date.now()),
          personaIndex: 0,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setLastPersonaIndex(0);
      }
    } catch (error) {
      console.error("Failed to create debate:", error);
      toast.error("Failed to start debate");
    } finally {
      setIsLoading(false);
    }
  };

  const stopDebate = () => {
    setIsDebateActive(false);
    setDebateId(null);
  };

  const handleUserInput = async () => {
    if (!inputValue.trim() || !debateId || !user) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");

    try {
      const response = await debatesAPI.sendMessage(debateId, messageToSend);

      if (response.aiMessage) {
        // Alternate persona
        const nextPersonaIndex: 0 | 1 = lastPersonaIndex === 0 ? 1 : 0;

        const aiMessage: ChatMessage = {
          id: response.aiMessage.id || `ai-${Date.now()}`,
          content: response.aiMessage.content,
          sender: "persona",
          timestamp: new Date(response.aiMessage.createdAt || Date.now()),
          personaIndex: nextPersonaIndex,
        };
        setMessages((prev) => [...prev, aiMessage]);
        setLastPersonaIndex(nextPersonaIndex);
      }
    } catch (error) {
      console.error("Failed to send user message:", error);
      toast.error("Failed to send message");
    }
  };

  // Auth check
  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-lg mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to start a debate between {personas[0].name} and{" "}
              {personas[1].name}
            </p>
            <Button onClick={() => (window.location.href = "/auth/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold font-[family-name:var(--font-playfair)] text-xl">
            Historical Debate
          </h3>
          <div className="flex items-center gap-2">
            {!isDebateActive ? (
              <Button
                onClick={startDebate}
                disabled={!debateTopic.trim() || isLoading}
                size="sm"
              >
                <Play className="h-4 w-4 mr-2" />
                {isLoading ? "Starting..." : "Start Debate"}
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
              disabled={isLoading}
            />
          </div>
        )}

        {/* Avatars */}
        <div className="flex items-center justify-center gap-8">
          {[0, 1].map((i) => (
            <div key={i} className="text-center">
              <img
                src={personas[i].avatar || "/placeholder.svg"}
                alt={personas[i].name}
                className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-border"
              />
              <h4 className="font-semibold text-sm">{personas[i].name}</h4>
              <Badge variant="secondary" className="text-xs mt-1">
                {personas[i].field || "Knowledge"}
              </Badge>
            </div>
          ))}
          <div className="text-3xl font-bold text-primary animate-pulse">
            VS
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isPersona0 =
            message.sender === "persona" && message.personaIndex === 0;
          const isPersona1 =
            message.sender === "persona" && message.personaIndex === 1;

          return (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user"
                  ? "justify-center"
                  : isPersona0
                  ? "justify-start"
                  : "justify-end"
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
                        src={
                          isPersona0 ? personas[0].avatar : personas[1].avatar
                        }
                        alt={isPersona0 ? personas[0].name : personas[1].name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-semibold text-sm">
                        {isPersona0 ? personas[0].name : personas[1].name}
                      </span>
                    </div>
                  )}

                  <div
                    className={`leading-relaxed ${
                      message.sender === "persona" ? "typewriter" : ""
                    }`}
                  >
                    {message.sender === "persona" ? (
                      <FormattedMessage content={message.content} />
                    ) : (
                      <div className="text-sm">{message.content}</div>
                    )}
                  </div>

                  <div className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <div className="flex-1">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleUserInput();
                }
              }}
              placeholder="Interject with your own thoughts or questions..."
              className="bg-background/80 border-2 border-border focus:border-primary transition-colors"
              disabled={isLoading || !isDebateActive}
            />
          </div>
          <Button
            onClick={handleUserInput}
            disabled={!inputValue.trim() || isLoading || !isDebateActive}
            className="quill-write"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
