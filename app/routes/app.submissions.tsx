import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { useState } from "react";
import prisma from "../db.server";

type FilterStatus = "pending" | "approved" | "rejected" | "all";

export async function loader({ request }: LoaderFunctionArgs) {
  const submissions = await prisma.offlineSubmission.findMany({
    orderBy: { createdAt: "desc" },
  });

  const origin = new URL(request.url).origin;

  const normalizedSubmissions = submissions.map((s) => ({
    ...s,
    fileUrl: s.fileUrl.startsWith("http")
      ? s.fileUrl
      : `${origin}${s.fileUrl.startsWith("/") ? "" : "/"}${s.fileUrl}`,
  }));

  return { submissions: normalizedSubmissions };
}

export default function AdminSubmissionsPage() {
  const { submissions } = useLoaderData<typeof loader>();
  const [processingId, setProcessingId] = useState("");
  const [pointsById, setPointsById] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<FilterStatus>("pending");

  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const approvedCount = submissions.filter((s) => s.status === "approved").length;
  const rejectedCount = submissions.filter((s) => s.status === "rejected").length;

  const filteredSubmissions =
    filter === "all" ? submissions : submissions.filter((s) => s.status === filter);

  async function approve(submissionId: string) {
    const awardedPoints = Number(pointsById[submissionId] || "0");

    if (!Number.isInteger(awardedPoints) || awardedPoints <= 0) {
      alert("Introduce una cantidad válida de puntos.");
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
    <div style={{ maxWidth: 1180, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 32 }}>Tickets offline</h1>
        <p style={{ color: "#667085", marginTop: 8 }}>
          Revisa tickets enviados por clientes, valida la compra y asigna puntos.
        </p>

        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <FilterButton
            label={`Pendientes (${pendingCount})`}
            active={filter === "pending"}
            onClick={() => setFilter("pending")}
          />
          <FilterButton
            label={`Aprobados (${approvedCount})`}
            active={filter === "approved"}
            onClick={() => setFilter("approved")}
          />
          <FilterButton
            label={`Rechazados (${rejectedCount})`}
            active={filter === "rejected"}
            onClick={() => setFilter("rejected")}
          />
          <FilterButton
            label={`Todos (${submissions.length})`}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
        </div>
      </div>

      {filteredSubmissions.length === 0 && (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            padding: 28,
            background: "#fff",
          }}
        >
          <h3 style={{ marginTop: 0 }}>No hay tickets en esta vista</h3>
          <p style={{ color: "#667085", marginBottom: 0 }}>
            Cambia el filtro para revisar otros estados.
          </p>
        </div>
      )}

      <div style={{ display: "grid", gap: 18 }}>
        {filteredSubmissions.map((s) => (
          <div
            key={s.id}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 18,
              padding: 22,
              background: "#fff",
              boxShadow: "0 8px 24px rgba(16, 24, 40, 0.04)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                alignItems: "flex-start",
                marginBottom: 18,
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 6px", fontSize: 20 }}>
                  Ticket de {s.customerEmail || "cliente"}
                </h3>
                <p style={{ margin: 0, color: "#667085", fontSize: 14 }}>
                  ID: {s.id}
                </p>
              </div>

              {statusBadge(s.status)}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <Info label="Customer ID" value={s.customerId} />
              <Info label="Email" value={s.customerEmail || "-"} />
              <Info label="Archivo" value={s.fileName || "Ver ticket"} link={s.fileUrl} />
              <Info label="Creado" value={new Date(s.createdAt).toLocaleString("es-ES")} />
            </div>

            {s.status === "pending" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: 12,
                  paddingTop: 18,
                  borderTop: "1px solid #f2f4f7",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    Puntos a otorgar
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej. 500"
                    value={pointsById[s.id] || ""}
                    onChange={(e) =>
                      setPointsById((prev) => ({
                        ...prev,
                        [s.id]: e.target.value,
                      }))
                    }
                    style={{
                      width: 180,
                      height: 40,
                      padding: "0 12px",
                      border: "1px solid #d0d5dd",
                      borderRadius: 10,
                    }}
                  />
                </div>

                <button
                  onClick={() => approve(s.id)}
                  disabled={processingId === s.id}
                  style={primaryButton}
                >
                  {processingId === s.id ? "Procesando..." : "Aprobar"}
                </button>

                <button
                  onClick={() => reject(s.id)}
                  disabled={processingId === s.id}
                  style={secondaryButton}
                >
                  {processingId === s.id ? "Procesando..." : "Rechazar"}
                </button>
              </div>
            )}

            {s.status === "approved" && (
              <div
                style={{
                  marginTop: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "#ecfdf3",
                  color: "#027a48",
                  fontWeight: 700,
                  display: "inline-block",
                }}
              >
                +{s.awardedPoints || 0} puntos otorgados
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function statusBadge(status: string) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    pending: { bg: "#fff7ed", color: "#b45309", label: "Pendiente" },
    approved: { bg: "#ecfdf3", color: "#027a48", label: "Aprobado" },
    rejected: { bg: "#fef3f2", color: "#b42318", label: "Rechazado" },
  };

  const current = styles[status] || {
    bg: "#f2f4f7",
    color: "#344054",
    label: status,
  };

  return (
    <span
      style={{
        display: "inline-flex",
        padding: "4px 10px",
        borderRadius: 999,
        background: current.bg,
        color: current.color,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {current.label}
    </span>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px",
        borderRadius: 999,
        border: active ? "0" : "1px solid #d0d5dd",
        background: active ? "#111827" : "#fff",
        color: active ? "#fff" : "#344054",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function Info({
  label,
  value,
  link,
}: {
  label: string;
  value: string;
  link?: string;
}) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#667085", marginBottom: 4 }}>{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer">
          {value}
        </a>
      ) : (
        <div style={{ fontWeight: 600 }}>{value}</div>
      )}
    </div>
  );
}

const primaryButton = {
  height: 40,
  padding: "0 18px",
  borderRadius: 10,
  border: "0",
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  height: 40,
  padding: "0 18px",
  borderRadius: 10,
  border: "1px solid #d0d5dd",
  background: "#fff",
  color: "#344054",
  fontWeight: 700,
  cursor: "pointer",
};