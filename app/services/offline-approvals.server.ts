import prisma from "../db.server";
import type { Prisma } from "@prisma/client";

type ApproveSubmissionInput = {
  submissionId: string;
  awardedPoints: number;
  reviewNotes?: string | null;
  decisionSource?: "manual" | "automatic" | "automatic_flagged";
};

const POINTS_AVAILABLE_NAMESPACE = "loyalty";
const POINTS_AVAILABLE_KEY = "points_available";

export async function approveSubmission({
  submissionId,
  awardedPoints,
  reviewNotes = null,
  decisionSource = "manual",
}: ApproveSubmissionInput) {
  if (!submissionId) throw new Error("Falta submissionId");

  if (!Number.isInteger(awardedPoints) || awardedPoints <= 0) {
    throw new Error("awardedPoints debe ser un entero mayor que 0");
  }

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const submission = await tx.offlineSubmission.findUnique({
      where: { id: submissionId },
    });

    if (!submission) throw new Error("Submission no encontrada");
    if (submission.status === "approved") throw new Error("La submission ya está aprobada");
    if (submission.status === "rejected") throw new Error("La submission ya está rechazada");

    const existingPoints = await tx.customerPoints.findFirst({
      where: {
        shop: submission.shopDomain,
        customerId: submission.customerId,
      },
    });

    const updatedCustomerPoints = existingPoints
      ? await tx.customerPoints.update({
          where: { id: existingPoints.id },
          data: {
            points: {
              increment: awardedPoints,
            },
          },
        })
      : await tx.customerPoints.create({
          data: {
            shop: submission.shopDomain,
            customerId: submission.customerId,
            points: awardedPoints,
          },
        });

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

    return {
      submission: updatedSubmission,
      newAvailablePoints: updatedCustomerPoints.points,
    };
  });

  await syncCustomerPointsMetafield({
    shopDomain: result.submission.shopDomain,
    customerId: result.submission.customerId,
    availablePoints: result.newAvailablePoints,
  });

  return result.submission;
}

async function syncCustomerPointsMetafield({
  shopDomain,
  customerId,
  availablePoints,
}: {
  shopDomain: string;
  customerId: string;
  availablePoints: number;
}) {
  const session = await prisma.session.findFirst({
    where: {
      shop: shopDomain,
    },
  });

  if (!session?.accessToken) {
    throw new Error("No se encontró sesión Shopify para actualizar metafields");
  }

  const customerGid = customerId.startsWith("gid://")
    ? customerId
    : `gid://shopify/Customer/${customerId}`;

  const apiVersion = process.env.SHOPIFY_API_VERSION || "2026-07";

  const response = await fetch(
    `https://${shopDomain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": session.accessToken,
      },
      body: JSON.stringify({
        query: `
          mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
            metafieldsSet(metafields: $metafields) {
              metafields {
                id
                namespace
                key
                value
              }
              userErrors {
                field
                message
              }
            }
          }
        `,
        variables: {
          metafields: [
            {
              ownerId: customerGid,
              namespace: POINTS_AVAILABLE_NAMESPACE,
              key: POINTS_AVAILABLE_KEY,
              type: "number_integer",
              value: String(availablePoints),
            },
          ],
        },
      }),
    }
  );

  const data = await response.json();

  const errors = data?.data?.metafieldsSet?.userErrors || [];

  if (!response.ok || errors.length > 0) {
    console.error("Error syncing Shopify customer points metafield:", data);
    throw new Error(errors[0]?.message || "Error actualizando metafield de puntos");
  }
}