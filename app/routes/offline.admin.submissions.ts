import { json, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status")?.trim();

    const allowedStatuses = ["pending", "pending_review"] as const;

    const where =
      statusParam && allowedStatuses.includes(statusParam as (typeof allowedStatuses)[number])
        ? { status: statusParam }
        : { status: { in: [...allowedStatuses] } };

    const submissions = await prisma.offlineSubmission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        shopDomain: true,
        customerId: true,
        customerEmail: true,
        fileUrl: true,
        fileName: true,
        mimeType: true,
        status: true,
        decisionSource: true,
        awardedPoints: true,
        reviewedAt: true,
        reviewNotes: true,
        rejectionReason: true,
        merchantName: true,
        purchaseDate: true,
        totalAmount: true,
        receiptNumber: true,
        ocrConfidence: true,
        createdAt: true,
      },
    });

    return json({
      ok: true,
      submissions,
    });
  } catch (error) {
    console.error("Error in /offline/admin/submissions:", error);
    return json(
      { ok: false, error: "Error interno al obtener submissions admin" },
      { status: 500 }
    );
  }
}