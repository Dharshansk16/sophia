import { BlobServiceClient } from "@azure/storage-blob";

type AzureBlobProps = {
  buffer: Buffer;
  filename: string;
  filetype?: string;
};

export default async function uploadToAzureBlob({
  buffer,
  filename,
  filetype,
}: AzureBlobProps): Promise<string> {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_BLOB_CONTAINER_NAME;

  if (!connStr || !containerName) {
    throw new Error("Azure storage configuration missing");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Ensure container exists (optional)
  await containerClient.createIfNotExists();

  // Sanitize filename
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blobName = `${Date.now()}-${safeName}`;

  // Upload
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: filetype || "application/octet-stream",
    },
  });

  return blockBlobClient.url;
}
