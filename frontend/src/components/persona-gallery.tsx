"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Persona } from "@/app/page"

const personas: Persona[] = [
  {
    id: "einstein",
    name: "Albert Einstein",
    field: "Physics",
    era: "1879-1955",
    avatar: "/albert-einstein-portrait-vintage-sepia.jpg",
    description: "Theoretical physicist who developed the theory of relativity",
    color: "sepia",
  },
  {
    id: "newton",
    name: "Isaac Newton",
    field: "Mathematics & Physics",
    era: "1643-1727",
    avatar: "/isaac-newton-portrait-vintage-sepia.jpg",
    description: "Mathematician and physicist who formulated the laws of motion",
    color: "amber",
  },
  {
    id: "plato",
    name: "Plato",
    field: "Philosophy",
    era: "428-348 BCE",
    avatar: "/plato-ancient-philosopher-portrait-marble-statue.jpg",
    description: "Ancient Greek philosopher and founder of the Academy",
    color: "stone",
  },
  {
    id: "curie",
    name: "Marie Curie",
    field: "Chemistry & Physics",
    era: "1867-1934",
    avatar: "/marie-curie-portrait-vintage-sepia.jpg",
    description: "Pioneering researcher on radioactivity and Nobel Prize winner",
    color: "emerald",
  },
  {
    id: "darwin",
    name: "Charles Darwin",
    field: "Natural Science",
    era: "1809-1882",
    avatar: "/charles-darwin-portrait-vintage-sepia.jpg",
    description: "Naturalist who proposed the theory of evolution",
    color: "green",
  },
  {
    id: "aristotle",
    name: "Aristotle",
    field: "Philosophy & Science",
    era: "384-322 BCE",
    avatar: "/aristotle-ancient-philosopher-portrait-marble-stat.jpg",
    description: "Ancient Greek philosopher and polymath",
    color: "slate",
  },
]

interface PersonaGalleryProps {
  onPersonaSelect: (persona: Persona) => void
  isDebateMode: boolean
  selectedDebatePersonas: [Persona | null, Persona | null]
}

export function PersonaGallery({ onPersonaSelect, isDebateMode, selectedDebatePersonas }: PersonaGalleryProps) {
  const isPersonaSelected = (persona: Persona) => {
    return selectedDebatePersonas[0]?.id === persona.id || selectedDebatePersonas[1]?.id === persona.id
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold font-[family-name:var(--font-playfair)] text-primary mb-2">
            Choose Your Historical Companion
          </h2>
          <p className="text-muted-foreground text-lg">
            {isDebateMode
              ? "Select two personas to witness an intellectual debate through the ages"
              : "Engage in profound conversations with history's greatest minds"}
          </p>
        </div>

        {isDebateMode && (selectedDebatePersonas[0] || selectedDebatePersonas[1]) && (
          <div className="flex items-center justify-center mb-8 gap-4">
            <div className="flex items-center gap-4">
              {selectedDebatePersonas[0] && (
                <div className="text-center">
                  <img
                    src={selectedDebatePersonas[0].avatar || "/placeholder.svg"}
                    alt={selectedDebatePersonas[0].name}
                    className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary"
                  />
                  <p className="text-sm font-medium">{selectedDebatePersonas[0].name}</p>
                </div>
              )}

              <div className="text-2xl font-bold text-primary animate-pulse">VS</div>

              {selectedDebatePersonas[1] ? (
                <div className="text-center">
                  <img
                    src={selectedDebatePersonas[1].avatar || "/placeholder.svg"}
                    alt={selectedDebatePersonas[1].name}
                    className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-primary"
                  />
                  <p className="text-sm font-medium">{selectedDebatePersonas[1].name}</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-dashed border-muted-foreground bg-muted/50 flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">Select</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Choose opponent</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <Card
              key={persona.id}
              className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 scroll-unfurl ${
                isPersonaSelected(persona) ? "ring-2 ring-primary bg-primary/5" : ""
              } ${isDebateMode && selectedDebatePersonas[0] && selectedDebatePersonas[1] ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => {
                if (!(isDebateMode && selectedDebatePersonas[0] && selectedDebatePersonas[1])) {
                  onPersonaSelect(persona)
                }
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="relative mb-4">
                  <img
                    src={persona.avatar || "/placeholder.svg"}
                    alt={persona.name}
                    className="w-24 h-24 rounded-full mx-auto border-4 border-border shadow-lg"
                  />
                  {isPersonaSelected(persona) && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-xs text-primary-foreground font-bold">
                        {selectedDebatePersonas[0]?.id === persona.id ? "1" : "2"}
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-bold font-[family-name:var(--font-playfair)] text-foreground mb-2">
                  {persona.name}
                </h3>

                <div className="flex flex-wrap gap-2 justify-center mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {persona.field}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {persona.era}
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{persona.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
