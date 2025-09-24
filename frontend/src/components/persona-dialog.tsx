"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, BookOpen } from "lucide-react";
import { personasAPI } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PersonaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: "create" | "edit" | "view";
  persona?: any;
}

export function PersonaDialog({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode, 
  persona 
}: PersonaDialogProps) {
  const [name, setName] = useState("");
  const [shortBio, setShortBio] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const isReadOnly = mode === "view";
  const isEdit = mode === "edit";
  const isCreate = mode === "create";

  useEffect(() => {
    if (persona) {
      setName(persona.name || "");
      setShortBio(persona.shortBio || "");
      setImageUrl(persona.imageUrl || "");
    } else {
      setName("");
      setShortBio("");
      setImageUrl("");
    }
  }, [persona, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setIsLoading(true);
    try {
      if (isCreate) {
        await personasAPI.createUser({
          name: name.trim(),
          shortBio: shortBio.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
        toast.success("Persona created successfully!");
      } else if (isEdit && persona) {
        await personasAPI.update(persona.id, {
          name: name.trim(),
          shortBio: shortBio.trim() || undefined,
          imageUrl: imageUrl.trim() || undefined,
        });
        toast.success("Persona updated successfully!");
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error saving persona:", error);
      const message = error.response?.data?.error || error.message || "Failed to save persona";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // For now, just show the file name
      // In a real app, you'd upload to a service like Cloudinary or AWS S3
      setImageUrl(file.name);
      toast.info("Image upload functionality would be implemented here");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isCreate ? "Create New Persona" : isEdit ? "Edit Persona" : "View Persona"}
          </DialogTitle>
          <DialogDescription>
            {isCreate
              ? "Create a new persona - it could be yourself, someone you admire, or any person you'd like to chat with."
              : isEdit
              ? "Edit your persona's details"
              : "View persona details"}
          </DialogDescription>
          {(isCreate || isEdit) && (
            <div className="mt-2 text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> After creating your persona, you can train it with documents by visiting the{" "}
              <button
                onClick={() => router.push('/uploads')}
                className="text-primary underline hover:no-underline"
              >
                Training Files page
              </button>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter the persona's name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortBio">Short Biography</Label>
              <Textarea
                id="shortBio"
                value={shortBio}
                onChange={(e) => setShortBio(e.target.value)}
                disabled={isReadOnly}
                placeholder="Describe who this persona is and what they're known for..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Profile Image</Label>
              <div className="flex gap-2">
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Enter image URL or upload an image"
                />
                {!isReadOnly && (
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Button type="button" variant="outline" size="icon">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {imageUrl && (
                <div className="mt-2">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-full object-cover border"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder.svg";
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.push('/uploads')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Training Files
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={onClose}>
              {isReadOnly ? "Close" : "Cancel"}
            </Button>
            {!isReadOnly && (
              <Button type="submit" disabled={isLoading}>
                {isLoading 
                  ? "Saving..." 
                  : isEdit 
                  ? "Update Persona" 
                  : "Create Persona"
                }
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}