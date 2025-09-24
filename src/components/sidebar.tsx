"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, X } from "lucide-react"
import type { Persona } from "@/lib/api"
import { useEffect, useState } from "react"
import { conversationsAPI, personasAPI } from "@/lib/api"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentView: "gallery" | "chat" | "debate"
  selectedPersona: Persona | null
  debatePersonas: [Persona | null, Persona | null]
}

export function Sidebar({ isOpen, onClose, currentView, selectedPersona, debatePersonas }: SidebarProps) {
  const [chatHistory, setChatHistory] = useState<
    { id: string; title: string; persona: string; date: string; personaId?: string }[]
  >([])
  const [personaDetails, setPersonaDetails] = useState<Record<string, string>>({})
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const userId = user?.id
    if (!userId) return

    setIsLoadingHistory(true)
    
    conversationsAPI.getAll(userId).then(async (conversations) => {
      if (!conversations) {
        setChatHistory([])
        setIsLoadingHistory(false)
        return
      }
      
      // Create a map of personaId to persona name
      const personaIds = [...new Set(conversations.map(conv => conv.personaId).filter(Boolean))]
      const personaMap: Record<string, string> = {}
      
      try {
        await Promise.all(
          personaIds.map(async (personaId) => {
            if (personaId) {
              try {
                const persona = await personasAPI.get(personaId)
                personaMap[personaId] = persona.name
              } catch (error) {
                console.error(`Failed to fetch persona ${personaId}:`, error)
                personaMap[personaId] = "Unknown Persona"
              }
            }
          })
        )
        setPersonaDetails(personaMap)
      } catch (error) {
        console.error("Failed to fetch persona details:", error)
      }
      
      // Group conversations by persona and generate numbered titles
      const personaSessionCounts: Record<string, number> = {}
      
      setChatHistory(
        conversations.map((conv) => {
          const personaName = conv.personaId ? (personaMap[conv.personaId] || "Unknown") : "Unknown";
          
          // Generate session title
          let title = conv.title;
          if (!title || title === "Untitled Session") {
            // Count sessions for this persona
            if (!personaSessionCounts[personaName]) {
              personaSessionCounts[personaName] = 0;
            }
            personaSessionCounts[personaName]++;
            title = `${personaName} - ${personaSessionCounts[personaName]}`;
          }
          
          return {
            id: conv.id,
            title: title,
            persona: personaName,
            date: new Date(conv.createdAt ?? "").toLocaleString(),
            personaId: conv.personaId || undefined,
          };
        })
      )
      
      setIsLoadingHistory(false)
    }).catch(error => {
      console.error("Failed to fetch conversations:", error)
      setIsLoadingHistory(false)
    })
  }, [user])

  useEffect(() => {
    // Update chat history with persona names and titles once they're loaded
    const personaSessionCounts: Record<string, number> = {}
    
    setChatHistory(prevHistory =>
      prevHistory.map(session => {
        const updatedPersonaName = session.personaId && personaDetails[session.personaId] 
          ? personaDetails[session.personaId]
          : session.persona
          
        // Update title if it was generated or is untitled
        let updatedTitle = session.title
        if (!session.title || session.title === "Untitled Session" || session.title.includes(" - ")) {
          if (!personaSessionCounts[updatedPersonaName]) {
            personaSessionCounts[updatedPersonaName] = 0;
          }
          personaSessionCounts[updatedPersonaName]++;
          updatedTitle = `${updatedPersonaName} - ${personaSessionCounts[updatedPersonaName]}`;
        }
        
        return {
          ...session,
          persona: updatedPersonaName,
          title: updatedTitle
        }
      })
    )
  }, [personaDetails])

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={`
        fixed md:relative top-0 left-0 h-full w-80 bg-card/80 backdrop-blur-sm border-r border-border z-50
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-lg">Session Info</h2>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4 h-full overflow-y-auto">
          {/* Current session */}
          {currentView !== "gallery" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Current Session
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {currentView === "chat" && selectedPersona && (
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedPersona.imageUrl || "/placeholder.svg"}
                      alt={selectedPersona.name}
                      className="w-10 h-10 rounded-full border border-border"
                    />
                    <div>
                      <p className="font-medium text-sm">{selectedPersona.name}</p>
                      <Badge variant="secondary" className="text-xs">
                        {selectedPersona.field}
                      </Badge>
                    </div>
                  </div>
                )}

                {currentView === "debate" && debatePersonas[0] && debatePersonas[1] && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <img
                        src={debatePersonas[0].imageUrl || "/placeholder.svg"}
                        alt={debatePersonas[0].name}
                        className="w-8 h-8 rounded-full border border-border"
                      />
                      <span className="text-sm font-medium">{debatePersonas[0].name}</span>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">VS</div>
                    <div className="flex items-center gap-3">
                      <img
                        src={debatePersonas[1].imageUrl || "/placeholder.svg"}
                        alt={debatePersonas[1].name}
                        className="w-8 h-8 rounded-full border border-border"
                      />
                      <span className="text-sm font-medium">{debatePersonas[1].name}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Active for 23 minutes
                </div>
              </CardContent>
            </Card>
          )}

          {/* Chat history */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <p className="text-xs text-muted-foreground">Loading sessions...</p>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  No chats found
                </div>
              ) : (
                chatHistory.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => { router.push(`/persona?sessionId=${session.id}`); onClose(); }}
                  >
                    <p className="font-medium text-sm text-balance">{session.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{session.persona}</p>
                    <p className="text-xs text-muted-foreground">{session.date}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Community suggestions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Suggested Topics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="p-2 rounded bg-muted/30 text-xs">
                "The nature of consciousness" - Popular debate topic
              </div>
              <div className="p-2 rounded bg-muted/30 text-xs">"Scientific method vs philosophical inquiry"</div>
              <div className="p-2 rounded bg-muted/30 text-xs">"Ethics in scientific discovery"</div>
            </CardContent>
          </Card>
        </div>
      </aside>
    </>
  )
}
