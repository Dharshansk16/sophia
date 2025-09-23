"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, Download, X } from "lucide-react"
import type { Persona } from "@/app/page"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  currentView: "gallery" | "chat" | "debate"
  selectedPersona: Persona | null
  debatePersonas: [Persona | null, Persona | null]
}

export function Sidebar({ isOpen, onClose, currentView, selectedPersona, debatePersonas }: SidebarProps) {
  const chatHistory = [
    { id: "1", title: "Discussion on Relativity", persona: "Einstein", date: "2 hours ago" },
    { id: "2", title: "Laws of Motion Debate", persona: "Newton vs Aristotle", date: "1 day ago" },
    { id: "3", title: "Philosophy of Knowledge", persona: "Plato", date: "3 days ago" },
  ]

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
                      src={selectedPersona.avatar || "/placeholder.svg"}
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
                        src={debatePersonas[0].avatar || "/placeholder.svg"}
                        alt={debatePersonas[0].name}
                        className="w-8 h-8 rounded-full border border-border"
                      />
                      <span className="text-sm font-medium">{debatePersonas[0].name}</span>
                    </div>
                    <div className="text-center text-xs text-muted-foreground">VS</div>
                    <div className="flex items-center gap-3">
                      <img
                        src={debatePersonas[1].avatar || "/placeholder.svg"}
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
              {chatHistory.map((session) => (
                <div
                  key={session.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                >
                  <p className="font-medium text-sm text-balance">{session.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{session.persona}</p>
                  <p className="text-xs text-muted-foreground">{session.date}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Export Session
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Users className="h-4 w-4 mr-2" />
                Share Debate
              </Button>
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
