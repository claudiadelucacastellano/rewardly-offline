import { json, type LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== "GET") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const customerId = url.searchParams.get("customerId")?.trim();

    if (!customerId) {
      return json({ ok: false, error: "Falta customerId" }, { status: 400 });
    }

    const submissions = await prisma.offlineSubmission.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        shopDomain: true,
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
        createdAt: true,
      },
    });

    return json({
      ok: true,
      submissions,
    });
  } catch (error) {
    console.error("Error in /offline/my-submissions:", error);
    return json(
      { ok: false, error: "Error interno al obtener submissions" },
      { status: 500 }
    );
  }
}