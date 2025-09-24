"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { personasAPI, uploadsAPI } from "@/lib/api";
import { toast } from "sonner";

interface Persona {
  id: string;
  name: string;
  description?: string;
  shortBio?: string;
  imageUrl?: string;
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Fetch user personas on component mount
  useEffect(() => {
    const fetchPersonas = async () => {
      if (!open || !user) return;
      
      try {
        const userPersonas = await personasAPI.listUser();
        setPersonas(userPersonas);
      } catch (error) {
        console.error("Failed to fetch personas:", error);
        toast.error("Failed to load personas");
      }
    };
    
    fetchPersonas();
  }, [open, user]);

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }

    if (!user?.id) {
      toast.error("You must be logged in to upload files");
      return;
    }

    setIsUploading(true);

    try {
      const results = [];
      
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("userId", user.id);
        if (selectedPersonaId) {
          formData.append("personaId", selectedPersonaId);
        }

        const result = await uploadsAPI.upload(formData);
        results.push(result);
      }

      const successCount = results.length;
      const hasTrainingSkipped = results.some(r => r.trainingStatus === "skipped");
      
      toast.success(`${successCount} file(s) uploaded successfully!`);
      
      if (hasTrainingSkipped) {
        toast.warning("Training was skipped due to missing configuration. Check with your administrator.");
      }

      setSelectedFiles([]);
      setSelectedPersonaId("");
      onSuccess();
    } catch (error: any) {
      console.error("Upload failed:", error);
      const message = error.response?.data?.error || error.message || "Failed to upload files";
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Training Files</DialogTitle>
          <DialogDescription>
            Upload PDF documents to train your personas. Files will be processed to create knowledge that your personas can use in conversations.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Upload zone */}
            <div className="space-y-2">
              <Label>Files (PDF recommended)</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive ? "border-primary bg-primary/5" : "border-border"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop PDF files here, or click to select
                </p>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Files
                </Button>
                <Input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>
            </div>

            {/* Persona selection */}
            <div className="space-y-2">
              <Label htmlFor="persona-select">Associate with Persona (Optional)</Label>
              <select
                id="persona-select"
                value={selectedPersonaId}
                onChange={(e) => setSelectedPersonaId(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-foreground"
              >
                <option value="">No specific persona (general knowledge)</option>
                {personas.map((persona) => (
                  <option key={persona.id} value={persona.id}>
                    {persona.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Files associated with a persona will enhance that persona's knowledge and responses.
              </p>
            </div>

            {/* Selected files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files ({selectedFiles.length})</Label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedFiles.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border rounded bg-muted/20"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)} • {file.type || "Unknown type"}
                        </p>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleRemoveFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isUploading || selectedFiles.length === 0}
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                `Upload ${selectedFiles.length} file(s)`
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}