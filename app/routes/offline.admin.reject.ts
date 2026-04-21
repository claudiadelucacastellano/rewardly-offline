import { json, type ActionFunctionArgs } from "@remix-run/node";
import { rejectSubmission } from "../services/offline-rejections.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, { status: 405 });
  }

  try {
    const formData = await request.formData();

    const submissionId = String(formData.get("submissionId") || "").trim();
    const reviewedByRaw = String(formData.get("reviewedBy") || "").trim();
    const reviewNotesRaw = String(formData.get("reviewNotes") || "").trim();
    const rejectionReasonRaw = String(formData.get("rejectionReason") || "").trim();

    if (!submissionId) {
      return json({ ok: false, error: "Falta submissionId" }, { status: 400 });
    }

    const submission = await rejectSubmission({
      submissionId,
      reviewedBy: reviewedByRaw || null,
      reviewNotes: reviewNotesRaw || null,
      decisionSource: "manual",
      rejectionReason: rejectionReasonRaw || null,
    });

    return json({
      ok: true,
      submission,
    });
  } catch (error) {
    console.error("Error in /offline/admin/reject:", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Error interno al rechazar submission",
      },
      { status: 500 }
    );
  }
}