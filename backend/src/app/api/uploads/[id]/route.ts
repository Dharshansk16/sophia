import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BlobServiceClient } from "@azure/storage-blob";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const upload = await prisma.upload.findUnique({ where: { id } });
    if (!upload)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Parse blob name from URL (assuming url format: https://<account>.blob.core.windows.net/<container>/<blobName>)
    if (upload.url) {
      try {
        const url = new URL(upload.url);
        const parts = url.pathname.split("/"); // ["", "container", "blobName", ...]
        const blobName = parts.slice(2).join("/");
        const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING!;
        const containerName = process.env.AZURE_BLOB_CONTAINER_NAME!;
        const blobServiceClient =
          BlobServiceClient.fromConnectionString(connStr);
        const containerClient =
          blobServiceClient.getContainerClient(containerName);
        const blockBlobClient = containerClient.getBlockBlobClient(blobName);
        await blockBlobClient.deleteIfExists();
      } catch (e) {
        console.warn(
          "Failed to delete blob (continuing to soft-delete DB record):",
          e
        );
      }
    }

    // Soft delete: set deletedAt
    await prisma.upload.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
