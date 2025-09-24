"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UploadDialog } from "@/components/upload-dialog";
import { toast } from "sonner";
import { Upload, Eye, Trash2, Download, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { uploadsAPI } from "@/lib/api";

interface UploadFile {
  id: string;
  filename: string;
  url?: string;
  uploadedById: string;
  personaId?: string | null;
  createdAt: string;
  deletedAt?: string;
  trainingStatus?: string;
}

export default function UploadsPage() {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const fetchUploads = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const data = await uploadsAPI.list();
      setUploads(data.map(upload => ({
        ...upload,
        createdAt: upload.createdAt || new Date().toISOString()
      })));
    } catch (error) {
      console.error("Failed to fetch uploads:", error);
      toast.error("Failed to fetch uploads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await uploadsAPI.delete(id);
      setUploads((prev) => prev.filter((u) => u.id !== id));
      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Failed to delete file:", error);
      toast.error("Failed to delete file");
    }
  };

  const handleDownload = (upload: UploadFile) => {
    if (upload.url) {
      window.open(upload.url, "_blank");
    } else {
      toast.error("No download URL available for this file");
    }
  };

  const handleUploadSuccess = () => {
    fetchUploads();
    setUploadDialogOpen(false);
  };

  useEffect(() => {
    fetchUploads();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#ece7df] via-[#d6cfc0] to-[#b8ab8f]">
        <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-black/10 shadow-2xl text-center">
          <h1 className="text-3xl font-bold text-black mb-4">
            Please Log In
          </h1>
          <p className="text-gray-600 mb-6">
            You must be logged in to manage uploads.
          </p>
          <Button onClick={() => router.push("/auth/login")}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ece7df] via-[#d6cfc0] to-[#b8ab8f] relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
              <h1 className="text-3xl font-bold font-[family-name:var(--font-playfair)] text-primary">
                Training Files
              </h1>
            </div>
            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="rounded-full bg-primary/80 hover:bg-primary"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </Button>
          </div>
          <p className="text-muted-foreground mt-2">
            Upload documents to train your personas. Associate files with specific personas to enhance their knowledge.
          </p>
        </header>

        {/* Content */}
        <Card className="bg-white/15 backdrop-blur-xl border border-white/20">
          <CardHeader>
            <CardTitle>Your Training Files</CardTitle>
            <CardDescription>
              Files you've uploaded to train your personas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading files...</p>
              </div>
            ) : uploads.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-xl font-bold mb-4">No Files Uploaded Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload PDF documents to train your personas with specific knowledge and expertise.
                </p>
                <Button 
                  onClick={() => setUploadDialogOpen(true)}
                  className="rounded-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Your First File
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Training Status</TableHead>
                    <TableHead>Associated Persona</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell className="font-medium max-w-xs">
                        <div className="truncate" title={upload.filename}>
                          {upload.filename}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            upload.trainingStatus === "completed" ? "default" :
                            upload.trainingStatus === "started" ? "secondary" :
                            upload.trainingStatus === "skipped" ? "destructive" :
                            "outline"
                          }
                        >
                          {upload.trainingStatus || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {upload.personaId ? (
                          <Badge variant="outline">{upload.personaId}</Badge>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {upload.url && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDownload(upload)}
                              title="Download file"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(upload.id)}
                            title="Delete file"
                          >
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
      </div>

      {/* Upload Dialog */}
      <UploadDialog 
        open={uploadDialogOpen} 
        onOpenChange={setUploadDialogOpen} 
        onSuccess={handleUploadSuccess} 
      />
    </div>
  );
}