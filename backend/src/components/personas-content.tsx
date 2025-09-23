"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PersonaDialog } from "@/components/persona-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Eye } from "lucide-react"

interface Persona {
  id: string
  name: string
  description: string
  imageUrl?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export function PersonasContent() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create")
  const { toast } = useToast()
  const { data: session } = useSession()

  // 🔹 Fetch all personas
  const fetchPersonas = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/personas")
      if (response.ok) {
        const data = await response.json()
        setPersonas(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch personas",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching personas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 🔹 Fetch single persona
  const fetchPersona = async (id: string) => {
    try {
      const response = await fetch(`/api/personas/${id}`)
      if (response.ok) {
        const data = await response.json()
        return data as Persona
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch persona details",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching persona details",
        variant: "destructive",
      })
    }
    return null
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this persona?")) return
    if (!session) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to delete personas",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/personas/${id}`, { method: "DELETE" })
      if (response.ok) {
        setPersonas((prev) => prev.filter((p) => p.id !== id))
        toast({
          title: "Success",
          description: "Persona deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete persona",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while deleting persona",
        variant: "destructive",
      })
    }
  }

  const handleCreate = () => {
    setSelectedPersona(null)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const handleEdit = async (persona: Persona) => {
    const fresh = await fetchPersona(persona.id)
    setSelectedPersona(fresh || persona) // fallback to stale data if fetch fails
    setDialogMode("edit")
    setDialogOpen(true)
  }

  const handleView = async (persona: Persona) => {
    const fresh = await fetchPersona(persona.id)
    setSelectedPersona(fresh || persona)
    setDialogMode("view")
    setDialogOpen(true)
  }

  const handleDialogSuccess = () => {
    fetchPersonas()
    setDialogOpen(false)
  }

  useEffect(() => {
    fetchPersonas()
  }, [session])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Personas</h1>
          <p className="text-muted-foreground">Manage your personas and their associated tags</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Persona
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Personas</CardTitle>
          <CardDescription>A list of all personas in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading personas...</div>
          ) : personas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No personas found. Create your first persona to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personas.map((persona) => (
                  <TableRow key={persona.id}>
                    <TableCell className="font-medium">{persona.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{persona.description}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(persona.tags || []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(persona.tags || []).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{persona.tags.length - 3}
                          </Badge>
                        )}

                      </div>
                    </TableCell>
                    <TableCell>{new Date(persona.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleView(persona)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(persona)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(persona.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PersonaDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        persona={selectedPersona}
        mode={dialogMode}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}
