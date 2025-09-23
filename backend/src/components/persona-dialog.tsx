"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { X, Plus } from "lucide-react"

interface Persona {
  id: string
  name: string
  slug: string
  shortBio?: string
  imageUrl?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

interface PersonaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona: Persona | null
  mode: "create" | "edit" | "view"
  onSuccess: () => void
}

export function PersonaDialog({ open, onOpenChange, persona, mode, onSuccess }: PersonaDialogProps) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [shortBio, setShortBio] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { data: session } = useSession()
  const isReadOnly = mode === "view"
  const isEdit = mode === "edit"
  const isCreate = mode === "create"

  const [initialTags, setInitialTags] = useState<string[]>([])

  useEffect(() => {
    if (persona) {
      setName(persona.name)
      setSlug(persona.slug)
      setShortBio(persona.shortBio || "")
      setImageUrl(persona.imageUrl || "")
      setTags(persona.tags || [])
      setInitialTags(persona.tags || [])
    } else {
      setName("")
      setSlug("")
      setShortBio("")
      setImageUrl("")
      setTags([])
      setInitialTags([])
    }
    setNewTag("")
  }, [persona, open])

  const handleAddTag = () => {
    const trimmed = newTag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isReadOnly) return
    if (!session) {
      toast({ title: "Unauthorized", description: "Login required", variant: "destructive" })
      return
    }

    setIsLoading(true)
    try {
      let personaId = persona?.id

      // Create or update persona
      if (isCreate || isEdit) {
        const url = isEdit ? `/api/personas/${personaId}` : `/api/personas`
        const method = isEdit ? "PATCH" : "POST"

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, slug, shortBio, imageUrl }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error?.message || "Failed to save persona")
        }

        const data = await response.json()
        personaId = data.id
      }

      // Sync tags
      if (personaId) {
        const added = tags.filter((t) => !initialTags.includes(t))
        const removed = initialTags.filter((t) => !tags.includes(t))

        for (const t of added) await fetch(`/api/personas/${personaId}/tags/${t}`, { method: "POST" })
        for (const t of removed) await fetch(`/api/personas/${personaId}/tags/${t}`, { method: "DELETE" })
      }

      toast({ title: "Success", description: `Persona ${isEdit ? "updated" : "created"} successfully` })
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Network error", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>{isCreate ? "Create Persona" : isEdit ? "Edit Persona" : "View Persona"}</DialogTitle>
          <DialogDescription>
            {isCreate ? "Add a new persona" : isEdit ? "Edit persona details" : "View persona"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={isReadOnly} required />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} disabled={isReadOnly} required />
            </div>
            <div className="space-y-2">
              <Label>Short Bio</Label>
              <Textarea value={shortBio} onChange={(e) => setShortBio(e.target.value)} disabled={isReadOnly} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={isReadOnly} />
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2 flex-wrap mb-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="flex items-center gap-1">
                    {t}
                    {!isReadOnly && (
                      <button type="button" onClick={() => handleRemoveTag(t)} className="ml-1 p-0.5 hover:bg-destructive/20 rounded-full">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {!isReadOnly && (
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : isEdit ? "Update" : "Create"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
