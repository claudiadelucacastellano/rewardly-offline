import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import prisma from "../db.server";

type Submission = {
  id: string;
  shopDomain: string;
  customerId: string;
  customerEmail: string | null;
  fileUrl: string;
  fileName: string | null;
  mimeType: string | null;
  status: string;
  decisionSource: string;
  awardedPoints: number | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  merchantName: string | null;
  purchaseDate: string | null;
  totalAmount: number | null;
  receiptNumber: string | null;
  ocrConfidence: number | null;
  createdAt: string;
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const submissions = await prisma.offlineSubmission.findMany({
      where: {
        status: "pending",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return Response.json({ ok: true, submissions });
  } catch (error) {
    console.error("Error loading offline submissions:", error);
    return Response.json(
      { ok: false, submissions: [], error: "Error al cargar submissions" },
      { status: 500 }
    );
  }
}

export default function AdminSubmissionsPage() {
  const { ok, submissions, error } = useLoaderData() as {
    ok: boolean;
    submissions: Submission[];
    error?: string;
  };

  const [processingId, setProcessingId] = useState("");
  const [pointsById, setPointsById] = useState<Record<string, string>>({});
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [rejectReasonById, setRejectReasonById] = useState<Record<string, string>>({});

  async function reloadPage() {
    window.location.reload();
  }

  async function handleApprove(submissionId: string) {
    const awardedPoints = Number(pointsById[submissionId] || "0");
    const reviewNotes = notesById[submissionId] || "";

    if (!Number.isInteger(awardedPoints) || awardedPoints <= 0) {
      alert("Introduce una cantidad válida de puntos");
      return;
    }

    try {
      setProcessingId(submissionId);

      const formData = new FormData();
      formData.append("submissionId", submissionId);
      formData.append("awardedPoints", String(awardedPoints));
      formData.append("reviewNotes", reviewNotes);

      const res = await fetch("/offline/admin/approve", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.error || "Error al aprobar");
        return;
      }

      await reloadPage();
    } catch (err) {
      console.error(err);
      alert("Error inesperado al aprobar");
    } finally {
      setProcessingId("");
    }
  }

  async function handleReject(submissionId: string) {
    const reviewNotes = notesById[submissionId] || "";
    const rejectionReason = rejectReasonById[submissionId] || "";

    try {
      setProcessingId(submissionId);

      const formData = new FormData();
      formData.append("submissionId", submissionId);
      formData.append("reviewNotes", reviewNotes);
      formData.append("rejectionReason", rejectionReason);

      const res = await fetch("/offline/admin/reject", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        alert(data.error || "Error al rechazar");
        return;
      }

      await reloadPage();
    } catch (err) {
      console.error(err);
      alert("Error inesperado al rechazar");
    } finally {
      setProcessingId("");
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: 24 }}>
      <h1>Submissions offline</h1>
      <p>Revisión manual de tickets pendientes.</p>

      {!ok && <p style={{ color: "red" }}>{error}</p>}
      {ok && submissions.length === 0 && <p>No hay submissions pendientes.</p>}

      <div style={{ display: "grid", gap: 20 }}>
        {submissions.map((submission) => (
          <div
            key={submission.id}
            style={{
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
            }}
          >
            <div style={{ display: "grid", gap: 8 }}>
              <strong>ID:</strong> <span>{submission.id}</span>
              <strong>Status:</strong> <span>{submission.status}</span>
              <strong>Customer ID:</strong> <span>{submission.customerId}</span>
              <strong>Email:</strong> <span>{submission.customerEmail || "-"}</span>
              <strong>Shop:</strong> <span>{submission.shopDomain}</span>
              <strong>Farmacia / comercio:</strong> <span>{submission.merchantName || "-"}</span>
              <strong>Archivo:</strong>{" "}
              <a href={submission.fileUrl} target="_blank" rel="noreferrer">
                {submission.fileName || "Ver archivo"}
              </a>
              <strong>Creado:</strong> <span>{new Date(submission.createdAt).toLocaleString()}</span>
            </div>

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
              <div>
                <label>Puntos a otorgar</label>
                <input
                  type="number"
                  min="1"
                  value={pointsById[submission.id] || ""}
                  onChange={(e) =>
                    setPointsById((prev) => ({ ...prev, [submission.id]: e.target.value }))
                  }
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div>
                <label>Notas de revisión</label>
                <textarea
                  rows={3}
                  value={notesById[submission.id] || ""}
                  onChange={(e) =>
                    setNotesById((prev) => ({ ...prev, [submission.id]: e.target.value }))
                  }
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div>
                <label>Motivo de rechazo</label>
                <input
                  type="text"
                  value={rejectReasonById[submission.id] || ""}
                  onChange={(e) =>
                    setRejectReasonById((prev) => ({
                      ...prev,
                      [submission.id]: e.target.value,
                    }))
                  }
                  style={{ width: "100%", padding: 8 }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => handleApprove(submission.id)}
                  disabled={processingId === submission.id}
                  style={{ padding: "10px 16px" }}
                >
                  {processingId === submission.id ? "Procesando..." : "Approve"}
                </button>

                <button
                  onClick={() => handleReject(submission.id)}
                  disabled={processingId === submission.id}
                  style={{ padding: "10px 16px" }}
                >
                  {processingId === submission.id ? "Procesando..." : "Reject"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}