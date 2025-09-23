"use client"

import { useState, useEffect } from "react"
import { useSession, signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TagDialog } from "@/components/tag-dialog"
import { AssignTagDialog } from "@/components/assign-tag-dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, UserPlus, Trash2 } from "lucide-react"

interface Tag {
  id: string
  name: string
  color: string
  description: string
  personaCount: number
  createdAt: string
}

export function TagsContent() {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()

  const fetchTags = async () => {
    if (!session) {
      toast({
        title: "Not logged in",
        description: "Please log in to view tags.",
        variant: "destructive",
      })
      return signIn()
    }

    try {
      const response = await fetch("/api/tags")
      if (response.ok) {
        const data = await response.json()
        setTags(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tags",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error while fetching tags",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!session) return signIn()

    if (!confirm("Are you sure you want to delete this tag? It will be removed from all personas.")) return

    try {
      const response = await fetch(`/api/tags/${id}`, { method: "DELETE" })
      if (response.ok) {
        setTags(tags.filter((t) => t.id !== id))
        toast({
          title: "Success",
          description: "Tag deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete tag",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Network error while deleting tag",
        variant: "destructive",
      })
    }
  }

  const handleCreateTag = () => {
    if (!session) return signIn()
    setTagDialogOpen(true)
  }

  const handleAssignTag = (tag: Tag) => {
    if (!session) return signIn()
    setSelectedTag(tag)
    setAssignDialogOpen(true)
  }

  const handleTagDialogSuccess = () => {
    fetchTags()
    setTagDialogOpen(false)
  }

  const handleAssignDialogSuccess = () => {
    fetchTags()
    setAssignDialogOpen(false)
  }

  useEffect(() => {
    fetchTags()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tags</h1>
          <p className="text-muted-foreground">Manage tags and assign them to personas</p>
        </div>
        <Button onClick={handleCreateTag}>
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tags</CardTitle>
          <CardDescription>A list of all tags in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading tags...</div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tags found. Create your first tag to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tag</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Personas</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="font-medium"
                        style={{ backgroundColor: tag.color + "20", color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{tag.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{tag.personaCount} personas</Badge>
                    </TableCell>
                    <TableCell>{new Date(tag.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleAssignTag(tag)}>
                          <UserPlus className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(tag.id)}>
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

      <TagDialog open={tagDialogOpen} onOpenChange={setTagDialogOpen} onSuccess={handleTagDialogSuccess} />

      <AssignTagDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        tag={selectedTag}
        onSuccess={handleAssignDialogSuccess}
      />
    </div>
  )
}
