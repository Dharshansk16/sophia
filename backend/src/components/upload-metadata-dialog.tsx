"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface UploadFile {
  id: string
  filename: string
  url?: string
  uploadedById: string
  personaId?: string
  createdAt: string
  deletedAt?: string
}

interface UploadMetadataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  upload: UploadFile | null
  onSuccess: () => void
}

export function UploadMetadataDialog({ open, onOpenChange, upload }: UploadMetadataDialogProps) {
  if (!upload) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>File Metadata</DialogTitle>
          <DialogDescription>Details about the uploaded file</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-4">
            {/* File name */}
            <div className="space-y-2">
              <Label>File Name</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                {upload.filename}
              </p>
            </div>

            {/* Upload date */}
            <div className="space-y-2">
              <Label>Uploaded At</Label>
              <p className="text-sm">{new Date(upload.createdAt).toLocaleString()}</p>
            </div>

            {/* URL */}
            {upload.url && (
              <div className="space-y-2">
                <Label>URL</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                  {upload.url}
                </p>
              </div>
            )}

            {/* Persona ID */}
            {upload.personaId && (
              <div className="space-y-2">
                <Label>Associated Persona</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{upload.personaId}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {upload.url && (
            <Button type="button" onClick={() => window.open(upload.url, "_blank")}>
              Open File
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
