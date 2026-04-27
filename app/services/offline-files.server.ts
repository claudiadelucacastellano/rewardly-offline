import { createHash } from "crypto";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateFileHash(file: File): Promise<string> {
  const buffer = await fileToBuffer(file);
  return createHash("sha256").update(buffer).digest("hex");
}

function sanitizeFileName(name: string) {
  return name
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-_]/g, "")
    .toLowerCase();
}

export async function storeTicketFile(file: File): Promise<{
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
}> {
  const buffer = await fileToBuffer(file);

  const safeName = sanitizeFileName(file.name);
  const timestamp = Date.now();

  const uploadResult = await new Promise<any>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "rewardly-offline/tickets",
        public_id: `${timestamp}-${safeName}`,
        resource_type: "auto",
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });

  return {
    fileUrl: uploadResult.secure_url,
    fileName: file.name,
    mimeType: file.type || null,
  };
}