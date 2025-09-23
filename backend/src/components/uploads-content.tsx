"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { UploadDialog } from "@/components/upload-dialog"
import { UploadMetadataDialog } from "@/components/upload-metadata-dialog"
import { useToast } from "@/hooks/use-toast"
import { Upload, Eye, Trash2, Download } from "lucide-react"

interface UploadFile {
  id: string
  filename: string
  url?: string
  uploadedById: string
  personaId?: string
  createdAt: string
  deletedAt?: string
}

export function UploadsContent() {
  const [uploads, setUploads] = useState<UploadFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [metadataDialogOpen, setMetadataDialogOpen] = useState(false)
  const [selectedUpload, setSelectedUpload] = useState<UploadFile | null>(null)
  const { toast } = useToast()
  const { data: session } = useSession()

  const fetchUploads = async () => {
    if (!session) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/uploads")
      if (response.ok) {
        const data = await response.json()
        setUploads(data)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch uploads",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while fetching uploads",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return
    if (!session) {
      toast({
        title: "Unauthorized",
        description: "You must be logged in to delete files",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`/api/uploads/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setUploads((prev) => prev.filter((u) => u.id !== id))
        toast({
          title: "Success",
          description: "File deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to delete file",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network error while deleting file",
        variant: "destructive",
      })
    }
  }

  const handleUpload = () => setUploadDialogOpen(true)
  const handleViewMetadata = (upload: UploadFile) => {
    setSelectedUpload(upload)
    setMetadataDialogOpen(true)
  }
  const handleDownload = (upload: UploadFile) => {
    if (upload.url) {
      window.open(upload.url, "_blank")
    } else {
      toast({
        title: "Error",
        description: "No download URL available for this file",
        variant: "destructive",
      })
    }
  }
  const handleUploadSuccess = () => {
    fetchUploads()
    setUploadDialogOpen(false)
  }

  useEffect(() => {
    fetchUploads()
  }, [session])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Uploads</h1>
          <p className="text-muted-foreground">Manage your uploaded files and view metadata</p>
        </div>
        <Button onClick={handleUpload}>
          <Upload className="mr-2 h-4 w-4" />
          Upload File
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Files</CardTitle>
          <CardDescription>A list of all uploaded files in your system</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading uploads...</div>
          ) : uploads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files uploaded yet. Upload your first file to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {uploads.map((upload) => (
                  <TableRow key={upload.id}>
                    <TableCell className="font-medium max-w-xs truncate">{upload.filename}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">File</Badge>
                    </TableCell>
                    <TableCell>Unknown size</TableCell>
                    <TableCell>{new Date(upload.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => handleViewMetadata(upload)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(upload)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(upload.id)}>
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

      <UploadDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} onSuccess={handleUploadSuccess} />

      <UploadMetadataDialog open={metadataDialogOpen} onOpenChange={setMetadataDialogOpen} upload={selectedUpload} onSuccess={handleUploadSuccess} />
    </div>
  )
}
