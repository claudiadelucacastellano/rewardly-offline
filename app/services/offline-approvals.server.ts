import prisma from "../db.server";
import type { Prisma } from "@prisma/client";

type ApproveSubmissionInput = {
  submissionId: string;
  awardedPoints: number;
  reviewNotes?: string | null;
  decisionSource?: "manual" | "automatic" | "automatic_flagged";
};

export async function approveSubmission({
  submissionId,
  awardedPoints,
  reviewNotes = null,
  decisionSource = "manual",
}: ApproveSubmissionInput) {
  if (!submissionId) {
    throw new Error("Falta submissionId");
  }

  if (!Number.isInteger(awardedPoints) || awardedPoints <= 0) {
    throw new Error("awardedPoints debe ser un entero mayor que 0");
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const submission = await tx.offlineSubmission.findUnique({
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

    const customerPoints = await tx.customerPoints.findFirst({
      where: {
        shop: submission.shopDomain,
        customerId: submission.customerId,
      },
    });

    if (customerPoints) {
      await tx.customerPoints.update({
        where: { id: customerPoints.id },
        data: {
          points: {
            increment: awardedPoints,
          },
        },
      });
    } else {
      await tx.customerPoints.create({
        data: {
          shop: submission.shopDomain,
          customerId: submission.customerId,
          points: awardedPoints,
        },
      });
    }

    await tx.pointsTransaction.create({
      data: {
        shop: submission.shopDomain,
        customerId: submission.customerId,
        type: "offline_earn",
        points: awardedPoints,
        note: `Puntos otorgados por ticket offline (${submission.id})`,
        status: "completed",
      },
    });

    const updatedSubmission = await tx.offlineSubmission.update({
      where: { id: submission.id },
      data: {
        status: "approved",
        awardedPoints,
        reviewedAt: new Date(),
        reviewNotes,
        decisionSource,
      },
    });

    return updatedSubmission;
  });
}