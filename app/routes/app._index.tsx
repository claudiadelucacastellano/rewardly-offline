import { Link } from "react-router";

export default function Index() {
  return (
    <div style={{ maxWidth: 1180, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div
        style={{
          background: "#111827",
          color: "#fff",
          borderRadius: 24,
          padding: 36,
          marginBottom: 24,
        }}
      >
        <p style={{ margin: "0 0 10px", color: "#d1d5db", fontWeight: 700 }}>
          Rewardly Offline
        </p>

        <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.1 }}>
          Convierte compras offline en puntos.
        </h1>

        <p style={{ maxWidth: 680, marginTop: 14, color: "#d1d5db", fontSize: 16 }}>
          Revisa tickets enviados por clientes, valida la compra y asigna puntos reales
          en la cuenta de fidelización.
        </p>

        <Link
          to="/app/submissions"
          style={{
            display: "inline-flex",
            marginTop: 20,
            background: "#fff",
            color: "#111827",
            padding: "12px 18px",
            borderRadius: 12,
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          Revisar tickets
        </Link>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 16,
        }}
      >
        <Card
          title="Tickets pendientes"
          text="Consulta los tickets enviados desde la landing y revisa cada archivo."
        />

        <Card
          title="Aprobación manual"
          text="Asigna puntos solo cuando el ticket sea válido y evita duplicados."
        />

        <Card
          title="Historial conectado"
          text="Los puntos aprobados quedan guardados y sincronizados con Rewardly."
        />
      </div>
    </div>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 18,
        padding: 22,
        background: "#fff",
        boxShadow: "0 8px 24px rgba(16, 24, 40, 0.04)",
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{title}</h3>
      <p style={{ margin: 0, color: "#667085", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}