import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import uploadToAzureBlob from "@/lib/azureBlob";
import { trainPdfHybridNeo4j } from "@/lib/training";

//upload pdf and store in azure and save meta data in prisma
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const personaId = formData.get("personaId") as string;
    const userId = formData.get("userId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const origName = file.name;

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const urlResult = await uploadToAzureBlob({
      buffer,
      filename: file.name,
      filetype: file.type,
    });

    if (typeof urlResult !== "string") {
      // If uploadToAzureBlob returned an error response, forward it
      return urlResult;
    }
    const url = urlResult;

    // Save to Prisma (use uploadedById, personaId may be null)
    const uploadRecord = await prisma.upload.create({
      data: {
        filename: origName,
        url,
        uploadedById: userId,
        personaId: personaId ? personaId : null,
      },
    });

    //start training
    trainPdfHybridNeo4j(file, uploadRecord.id, personaId, url)
      .then(() => {
        console.log("Training finished for upload:", uploadRecord.id);
      })
      .catch((err) => {
        console.error("Training failed for upload:", uploadRecord.id, err);
      });

    return NextResponse.json(uploadRecord, { status: 201 });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
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
