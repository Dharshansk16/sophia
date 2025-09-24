import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import uploadToAzureBlob from "@/lib/azure/uploadToAzureBlog";
import { trainPdfHybridNeo4j } from "@/lib/training/training";
import { canPerformTraining, canPerformFileUpload } from "@/lib/config/validation";

//upload pdf and store in azure and save meta data in prisma
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const personaId = formData.get("personaId") as string;
    const userId = formData.get("userId") as string;

    console.log("Upload request received:", { 
      fileName: file?.name, 
      fileSize: file?.size,
      personaId, 
      userId 
    });

    if (!file) {
      console.error("No file provided in upload request");
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!userId) {
      console.error("No userId provided in upload request");
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const origName = file.name;

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    console.log("File read into buffer, size:", buffer.length);

    // Check if file upload is properly configured
    const uploadConfig = canPerformFileUpload();
    if (!uploadConfig.isValid) {
      console.error("File upload not configured:", uploadConfig.missingVars);
      return NextResponse.json({
        error: "File upload service not configured",
        missingConfig: uploadConfig.missingVars
      }, { status: 503 });
    }

    // Upload to Azure Blob Storage
    console.log("Uploading file to Azure Blob Storage...");
    const urlResult = await uploadToAzureBlob({
      buffer,
      filename: file.name,
      filetype: file.type,
    });

    if (typeof urlResult !== "string") {
      // If uploadToAzureBlob returned an error response, forward it
      console.error("Azure blob upload failed:", urlResult);
      return urlResult;
    }
    const url = urlResult;
    console.log("File uploaded to Azure Blob Storage:", url);

    // Save to Prisma (use uploadedById, personaId may be null)
    console.log("Saving upload metadata to database...");
    const uploadRecord = await prisma.upload.create({
      data: {
        filename: origName,
        url,
        uploadedById: userId,
        personaId: personaId ? personaId : null,
      },
    });
    console.log("Upload record created:", uploadRecord);

    // Check if training can be performed
    const trainingConfig = canPerformTraining();
    
    if (!trainingConfig.isValid) {
      console.warn("Training skipped - missing configuration:", trainingConfig.missingVars);
      return NextResponse.json({
        ...uploadRecord,
        trainingStatus: "skipped",
        message: `File uploaded successfully, but training was skipped due to missing configuration: ${trainingConfig.missingVars.join(', ')}`
      }, { status: 201 });
    }

    //start training
    console.log("Starting training process for upload:", uploadRecord.id);
    trainPdfHybridNeo4j(file, uploadRecord.id, personaId, url)
      .then(() => {
        console.log("Training finished successfully for upload:", uploadRecord.id);
      })
      .catch((err) => {
        console.error("Training failed for upload:", uploadRecord.id, "Error:", err);
        console.error("Training error details:", {
          name: err?.name,
          message: err?.message,
          stack: err?.stack
        });
      });

    return NextResponse.json({
      ...uploadRecord,
      trainingStatus: "started",
      message: "File uploaded successfully and training has been started"
    }, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    console.error("Upload error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { 
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

//list all uploads or by personaId
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personaId = searchParams.get("personaId");

  const uploads = await prisma.upload.findMany({
    where: personaId ? { personaId } : {},
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(uploads);
}
