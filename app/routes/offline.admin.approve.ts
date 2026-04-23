import { json, type ActionFunctionArgs } from "@remix-run/node";
import { approveSubmission } from "../services/offline-approvals.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    const submissionId = String(formData.get("submissionId") || "").trim();
    const awardedPointsRaw = String(formData.get("awardedPoints") || "").trim();
    const reviewNotesRaw = String(formData.get("reviewNotes") || "").trim();

    if (!submissionId) {
      return json({ ok: false, error: "Falta submissionId" }, { status: 400 });
    }

    if (!awardedPointsRaw) {
      return json({ ok: false, error: "Falta awardedPoints" }, { status: 400 });
    }

    const awardedPoints = Number(awardedPointsRaw);

    if (!Number.isInteger(awardedPoints) || awardedPoints <= 0) {
      return json(
        { ok: false, error: "awardedPoints debe ser un entero mayor que 0" },
        { status: 400 }
      );
    }

    const submission = await approveSubmission({
      submissionId,
      awardedPoints,
      reviewNotes: reviewNotesRaw || null,
      decisionSource: "manual",
    });

    return json({
      ok: true,
      submission,
    });
  } catch (error) {
    console.error("Error in /offline/admin/approve:", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error interno al aprobar submission",
      },
      { status: 500 }
    );
  }
}