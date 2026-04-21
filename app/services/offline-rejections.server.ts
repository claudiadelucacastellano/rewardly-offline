import prisma from "../db.server";

type RejectSubmissionInput = {
  submissionId: string;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  decisionSource?: "manual" | "automatic" | "automatic_flagged";
  rejectionReason?: string | null;
};

export async function rejectSubmission({
  submissionId,
  reviewedBy = null,
  reviewNotes = null,
  decisionSource = "manual",
  rejectionReason = null,
}: RejectSubmissionInput) {
  if (!submissionId) {
    throw new Error("Falta submissionId");
  }

  const submission = await prisma.offlineSubmission.findUnique({
    where: { id: submissionId },
  });

  if (!submission) {
    throw new Error("Submission no encontrada");
  }

  if (submission.status === "approved") {
    throw new Error("La submission ya está aprobada");
  }

  if (submission.status === "rejected") {
    throw new Error("La submission ya está rechazada");
  }

  const updatedSubmission = await prisma.offlineSubmission.update({
    where: { id: submission.id },
    data: {
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy,
      reviewNotes,
      decisionSource,
      rejectionReason,
    },
  });

  return updatedSubmission;
}