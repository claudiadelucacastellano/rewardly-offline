import { json, type ActionFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";
import { generateFileHash, storeTicketFile } from "../services/offline-files.server";

function buildDuplicateCheckKey({
  shopDomain,
  customerId,
  fileHash,
}: {
  shopDomain: string;
  customerId: string;
  fileHash: string;
}) {
  return `${shopDomain}:${customerId}:${fileHash}`;
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    const shopDomain = String(formData.get("shopDomain") || "").trim();
    const customerId = String(formData.get("customerId") || "").trim();
    const customerEmailRaw = String(formData.get("customerEmail") || "").trim();
    const merchantNameRaw = String(formData.get("merchantName") || "").trim();
    const reviewNotesRaw = String(formData.get("reviewNotes") || "").trim();
    const file = formData.get("file");

    if (!shopDomain) {
      return json({ ok: false, error: "Falta shopDomain" }, { status: 400 });
    }

    if (!customerId) {
      return json({ ok: false, error: "Falta customerId" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return json({ ok: false, error: "Falta el archivo del ticket" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      return json({ ok: false, error: "Formato no permitido" }, { status: 400 });
    }

    const fileHash = await generateFileHash(file);
    const duplicateCheckKey = buildDuplicateCheckKey({
      shopDomain,
      customerId,
      fileHash,
    });

    const existing = await prisma.offlineSubmission.findFirst({
      where: { duplicateCheckKey },
    });

    if (existing) {
      return json(
        { ok: false, error: "Este ticket ya ha sido enviado" },
        { status: 409 }
      );
    }

    const storedFile = await storeTicketFile(file);

    const submission = await prisma.offlineSubmission.create({
      data: {
        shopDomain,
        customerId,
        customerEmail: customerEmailRaw || null,
        fileUrl: storedFile.fileUrl,
        fileName: storedFile.fileName,
        mimeType: storedFile.mimeType,
        status: "pending",
        decisionSource: "manual",
        reviewNotes: reviewNotesRaw || null,
        merchantName: merchantNameRaw || null,
        fileHash,
        duplicateCheckKey,
      },
    });

    return json({
      ok: true,
      submissionId: submission.id,
      status: submission.status,
    });
  } catch (error) {
    console.error("Error in /offline/submit:", error);
    return json({ ok: false, error: "Error interno al guardar el ticket" }, { status: 500 });
  }
}