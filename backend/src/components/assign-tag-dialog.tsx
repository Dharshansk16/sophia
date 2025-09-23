"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSession, getSession } from "next-auth/react"

interface Tag {
  id: string
  name: string
  color: string
  description: string
  personaCount: number
  createdAt: string
}

interface Persona {
  id: string
  name: string
  description: string
  tags: string[]
}

interface AssignTagDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag: Tag | null
  onSuccess: () => void
}

export function AssignTagDialog({ open, onOpenChange, tag, onSuccess }: AssignTagDialogProps) {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()

  const fetchPersonas = async () => {
    if (!tag || !session) return

    setIsFetching(true)
    try {
      const response = await fetch("/api/personas", {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setPersonas(data)
        const personasWithTag = data.filter((p: Persona) => p.tags.includes(tag.name)).map((p: Persona) => p.id)
        setSelectedPersonas(personasWithTag)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch personas",
        variant: "destructive",
      })
    } finally {
      setIsFetching(false)
    }
  }

  const handlePersonaToggle = (personaId: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(personaId) ? prev.filter((id) => id !== personaId) : [...prev, personaId],
    )
  }

  const handleSubmit = async () => {
    if (!tag || !session) return

    setIsLoading(true)
    try {
      const currentAssignments = personas.filter((p) => p.tags.includes(tag.name)).map((p) => p.id)
      const toAssign = selectedPersonas.filter((id) => !currentAssignments.includes(id))
      const toUnassign = currentAssignments.filter((id) => !selectedPersonas.includes(id))

      // Assign new personas
      await Promise.all(
        toAssign.map((personaId) =>
          fetch(`/api/personas/${personaId}/tags/${tag.id}`, {
            method: "POST",
            credentials: "include",
          }),
        ),
      )

      // Unassign personas
      await Promise.all(
        toUnassign.map((personaId) =>
          fetch(`/api/personas/${personaId}/tags/${tag.id}`, {
            method: "DELETE",
            credentials: "include",
          }),
        ),
      )

      toast({
        title: "Success",
        description: "Tag assignments updated successfully",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update tag assignments",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open && tag) {
      fetchPersonas()
    }
  }, [open, tag, session])

  if (!tag) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Assign Tag to Personas</DialogTitle>
          <DialogDescription>
            Select which personas should have the{" "}
            <Badge variant="secondary" style={{ backgroundColor: tag.color + "20", color: tag.color }}>
              {tag.name}
            </Badge>{" "}
            tag
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {isFetching ? (
            <div className="text-center py-8">Loading personas...</div>
          ) : personas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No personas found. Create personas first to assign tags.
            </div>
          ) : (
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {personas.map((persona) => (
                <div key={persona.id} className="flex items-center space-x-3 p-2 rounded border">
                  <Checkbox
                    id={persona.id}
                    checked={selectedPersonas.includes(persona.id)}
                    onCheckedChange={() => handlePersonaToggle(persona.id)}
                  />
                  <div className="flex-1">
                    <label htmlFor={persona.id} className="text-sm font-medium cursor-pointer">
                      {persona.name}
                    </label>
                    <p className="text-xs text-muted-foreground truncate">{persona.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || isFetching}>
            {isLoading ? "Updating..." : "Update Assignments"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
