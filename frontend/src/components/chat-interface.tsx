"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Mic, Paperclip } from "lucide-react";
import { conversationsAPI, type Persona, type Message } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { FormattedMessage } from "@/lib/message-formatter";

interface ChatMessage {
  id: string;
  content: string;
  sender: "user" | "persona";
  timestamp: Date;
  citations?: string[];
}

interface ChatInterfaceProps {
  persona: Persona;
  messages?: ChatMessage[];
}

export function ChatInterface({ persona, messages: messagesProp }: ChatInterfaceProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (messagesProp && messagesProp.length > 0) {
      return messagesProp;
    }
    return [
      {
        id: "1",
        content: `Greetings! I am ${
          persona.name
        }. I'm delighted to engage in discourse with you about the mysteries of ${
          persona.field?.toLowerCase() || "knowledge"
        } and the nature of our universe. What questions burn in your curious mind?`,
        sender: "persona",
        timestamp: new Date(),
      },
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messagesProp) {
      setMessages(messagesProp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesProp]);

  // Initialize conversation when component mounts
  useEffect(() => {
    const initializeConversation = async () => {
      if (!user) {
        toast.error("Please log in to start a conversation");
        return;
      }

      // Check if conversationId exists in URL
      const urlConversationId = searchParams.get("sessionId");
      if (urlConversationId) {
        setConversationId(urlConversationId);
        return;
      }

      try {
        const conversation = await conversationsAPI.create(
          user.id,
          persona.id,
          "SINGLE"
        );
        setConversationId(conversation.id);

        // Update URL with conversation id
        const params = new URLSearchParams(Array.from(searchParams.entries()));
        params.set("sessionId", conversation.id);
        router.replace(`?${params.toString()}`, { scroll: false });
      } catch (error) {
        console.error("Failed to create conversation:", error);
        toast.error("Failed to start conversation");
      }
    };

    initializeConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, persona.id]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // Send message to backend
      const response = await conversationsAPI.sendMessage(
        conversationId,
        inputValue,
        user.id
      );

      // Remove the temporary user message and add both user and AI messages from response
      setMessages((prev) => {
        const withoutTemp = prev.slice(0, -1); // Remove the temporary message
        const newMessages: ChatMessage[] = [];

        // Add user message from response
        if (response.userMessage) {
          newMessages.push({
            id: response.userMessage.id,
            content: response.userMessage.content,
            sender: "user",
            timestamp: new Date(response.userMessage.createdAt || Date.now()),
          });
        }

        // Add AI message from response
        if (response.aiMessage) {
          newMessages.push({
            id: response.aiMessage.id,
            content: response.aiMessage.content,
            sender: "persona",
            timestamp: new Date(response.aiMessage.createdAt || Date.now()),
          });
        }

        return [...withoutTemp, ...newMessages];
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");

      // Remove the temporary user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show login prompt if user is not authenticated
  if (!user) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="font-bold text-lg mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to start a conversation with {persona.name}
            </p>
            <Button onClick={() => (window.location.href = "/auth/login")}>
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while initializing conversation
  if (!conversationId) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">
            Preparing conversation with {persona.name}...
          </p>
        </div>
      </div>
    );
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
          <h3 className="font-bold font-[family-name:var(--font-playfair)] text-base md:text-lg truncate">
            {persona.name}
          </h3>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {persona.field || "Knowledge"}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {persona.era || "Timeless"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 min-h-0">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <Card
              className={`w-fit ${
                message.sender === "user"
                  ? "max-w-[75%] md:max-w-[60%] bg-primary text-primary-foreground"
                  : "max-w-[85%] md:max-w-[75%] bg-card border-2 border-border shadow-md"
              }`}
            >
              <CardContent
                className={`${
                  message.sender === "user" ? "p-2 md:p-3" : "p-3 md:p-4"
                }`}
              >
                <div
                  className={`leading-relaxed break-words ${
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
                  <span className="text-sm text-muted-foreground">
                    {persona.name} is contemplating...
                  </span>
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
              disabled={isTyping}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 md:h-8 md:w-8 p-0"
              >
                <Paperclip className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 md:h-8 md:w-8 p-0"
              >
                <Mic className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="quill-write flex-shrink-0"
          >
            <Send className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
