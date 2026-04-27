import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import prisma from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const submissions = await prisma.offlineSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  return { submissions };
}

export default function AdminSubmissionsPage() {
  const { submissions } = useLoaderData<typeof loader>();
  const [processingId, setProcessingId] = useState("");
  const [pointsById, setPointsById] = useState<Record<string, string>>({});

  async function approve(submissionId: string) {
    const awardedPoints = Number(pointsById[submissionId] || "0");

    if (!Number.isInteger(awardedPoints) || awardedPoints <= 0) {
      alert("Introduce puntos válidos");
      return;
    }

    setProcessingId(submissionId);

    const formData = new FormData();
    formData.append("submissionId", submissionId);
    formData.append("awardedPoints", String(awardedPoints));
    formData.append("reviewNotes", "Aprobado manualmente");

    const res = await fetch("/offline/admin/approve", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setProcessingId("");

    if (!res.ok || !data.ok) {
      alert(data.error || "Error al aprobar");
      return;
    }

    window.location.reload();
  }

  async function reject(submissionId: string) {
    setProcessingId(submissionId);

    const formData = new FormData();
    formData.append("submissionId", submissionId);
    formData.append("reviewNotes", "Rechazado manualmente");
    formData.append("rejectionReason", "Ticket no válido");

    const res = await fetch("/offline/admin/reject", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    setProcessingId("");

    if (!res.ok || !data.ok) {
      alert(data.error || "Error al rechazar");
      return;
    }

    window.location.reload();
  }

  return (
    <div>
      <h1>Tickets offline</h1>

      {submissions.length === 0 && <p>No hay tickets aún.</p>}

      <div style={{ display: "grid", gap: 16 }}>
        {submissions.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid #ccc",
              padding: 16,
              borderRadius: 8,
            }}
          >
            <p><strong>ID:</strong> {s.id}</p>
            <p><strong>Status:</strong> {s.status}</p>
            <p><strong>Customer:</strong> {s.customerId}</p>
            <p><strong>Email:</strong> {s.customerEmail || "-"}</p>

            <p>
              <strong>Archivo:</strong>{" "}
              <a href={s.fileUrl} target="_blank" rel="noreferrer">
                {s.fileName || "Ver ticket"}
              </a>
            </p>

            {s.status === "pending" && (
              <>
                <input
                  type="number"
                  min="1"
                  placeholder="Puntos a otorgar"
                  value={pointsById[s.id] || ""}
                  onChange={(e) =>
                    setPointsById((prev) => ({
                      ...prev,
                      [s.id]: e.target.value,
                    }))
                  }
                  style={{ padding: 8, marginBottom: 12, width: 220 }}
                />

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => approve(s.id)}
                    disabled={processingId === s.id}
                  >
                    {processingId === s.id ? "Procesando..." : "Approve"}
                  </button>

                  <button
                    onClick={() => reject(s.id)}
                    disabled={processingId === s.id}
                  >
                    {processingId === s.id ? "Procesando..." : "Reject"}
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}