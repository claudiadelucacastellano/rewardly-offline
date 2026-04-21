import { createHash } from "crypto";

export async function fileToBuffer(file: File): Promise<Buffer> {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function generateFileHash(file: File): Promise<string> {
  const buffer = await fileToBuffer(file);
  return createHash("sha256").update(buffer).digest("hex");
}

export async function storeTicketFile(file: File): Promise<{
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
}> {
  // Provisional:
  // no subimos a cloud todavía, pero mantenemos la interfaz final.
  const safeName = file.name.replace(/\s+/g, "-");
  const fakePath = `/uploads/${Date.now()}-${safeName}`;

  return {
    fileUrl: fakePath,
    fileName: file.name,
    mimeType: file.type || null,
  };
}