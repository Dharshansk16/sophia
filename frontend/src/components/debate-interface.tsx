"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, Users } from "lucide-react";
import { debatesAPI, conversationsAPI, type Persona } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

interface DebateMessage {
  id: string;
  content: string;
  author: string;
  personaId: string;
  conversationId: string;
  createdAt: string;
}

interface DebateInterfaceProps {
  selectedPersonas: Persona[];
  onClose: () => void;
}

export function DebateInterface({
  selectedPersonas,
  onClose,
}: DebateInterfaceProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const [isDebating, setIsDebating] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentDebateId, setCurrentDebateId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<string>("");

  // Add message to state
  const addMessage = (message: DebateMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  // Get persona by ID
  const getPersonaById = (id: string) => {
    return selectedPersonas.find((p) => p.id === id);
  };

  // Get persona color
  const getPersonaColor = (personaId: string) => {
    const persona = getPersonaById(personaId);
    return persona?.color || "#6366f1";
  };

  // Start debate
  const startDebate = async () => {
    if (!topic.trim()) {
      toast.error("Please enter a debate topic");
      return;
    }

    if (selectedPersonas.length < 2) {
      toast.error("Please select at least 2 personas for the debate");
      return;
    }

    if (!user) {
      toast.error("Please log in to start a debate");
      return;
    }

    try {
      setIsStarting(true);
      setMessages([]);

      // Create debate
      const response = await debatesAPI.create(
        topic.trim(),
        selectedPersonas.map((p) => p.id),
        user.id
      );

      setCurrentDebateId(response.id);
      setIsDebating(true);
      setTopic("");

      // Start automatic debate continuation
      setTimeout(() => continueDebate(response.id), 1000);

      toast.success("Debate started! Personas will now debate automatically.");
    } catch (error: any) {
      console.error("Error starting debate:", error);
      toast.error(error.response?.data?.error || "Failed to start debate");
    } finally {
      setIsStarting(false);
    }
  };

  // Continue debate automatically
  const continueDebate = async (debateId: string) => {
    if (!isDebating) return;

    try {
      setIsTyping(true);

      // Send message to trigger next persona response
      const response = await debatesAPI.sendMessage(debateId, "continue");

      if (response.data?.message) {
        const newMessage: DebateMessage = {
          id: response.data.message.id || Date.now().toString(),
          content: response.data.message.content,
          author: response.data.message.author,
          personaId: response.data.message.personaId,
          conversationId: response.data.message.conversationId,
          createdAt:
            response.data.message.createdAt || new Date().toISOString(),
        };

        addMessage(newMessage);
        setCurrentPersona(newMessage.author);

        // Continue debate after a delay if still active
        if (isDebating) {
          setTimeout(() => continueDebate(debateId), 3000);
        }
      }
    } catch (error: any) {
      console.error("Error continuing debate:", error);
      if (error.response?.status !== 404) {
        toast.error("Error in debate continuation");
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Stop debate
  const stopDebate = () => {
    setIsDebating(false);
    setCurrentDebateId(null);
    setIsTyping(false);
    setCurrentPersona("");
    toast.success("Debate stopped");
  };

  return (
    <div className="h-full flex flex-col">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Debate Arena
            </CardTitle>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Show selected personas */}
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedPersonas.map((persona) => (
              <Badge
                key={persona.id}
                variant="secondary"
                style={{
                  backgroundColor: `${persona.color}20`,
                  borderColor: persona.color,
                }}
              >
                {persona.name}
              </Badge>
            ))}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4">
          {!isDebating ? (
            /* Topic Input */
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Enter Debate Topic
                </label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Should artificial intelligence be regulated by governments?"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isStarting) {
                      startDebate();
                    }
                  }}
                />
              </div>

              <Button
                onClick={startDebate}
                disabled={
                  isStarting || !topic.trim() || selectedPersonas.length < 2
                }
                className="w-full"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting Debate...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Debate
                  </>
                )}
              </Button>
            </div>
          ) : (
            /* Active Debate */
            <div className="flex-1 flex flex-col">
              {/* Debate Controls */}
              <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium">Debate Active</span>
                  {isTyping && currentPersona && (
                    <span className="text-xs text-muted-foreground">
                      {currentPersona} is typing...
                    </span>
                  )}
                </div>
                <Button variant="destructive" size="sm" onClick={stopDebate}>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Debate
                </Button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Debate will start automatically...
                  </div>
                ) : (
                  messages.map((message) => {
                    const persona = getPersonaById(message.personaId);
                    return (
                      <div
                        key={message.id}
                        className="p-4 rounded-lg border-l-4"
                        style={{
                          borderLeftColor: getPersonaColor(message.personaId),
                          backgroundColor: `${getPersonaColor(
                            message.personaId
                          )}08`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="secondary"
                            style={{
                              backgroundColor: getPersonaColor(
                                message.personaId
                              ),
                              color: "white",
                            }}
                          >
                            {persona?.name || message.author}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    );
                  })
                )}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-center gap-2 p-4 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Generating response...</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
