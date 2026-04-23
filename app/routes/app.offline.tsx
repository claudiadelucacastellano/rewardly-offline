import { useState } from "react";

export default function OfflinePage() {
  const [shopDomain, setShopDomain] = useState("rewardly-dev-8btvi7pk.myshopify.com");
  const [customerId, setCustomerId] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResult("");

    if (!shopDomain.trim()) {
      setResult("Falta shopDomain");
      return;
    }

    if (!customerId.trim()) {
      setResult("Falta customerId");
      return;
    }

    if (!file) {
      setResult("Selecciona un archivo");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("shopDomain", shopDomain);
      formData.append("customerId", customerId);
      formData.append("customerEmail", customerEmail);
      formData.append("merchantName", merchantName);
      formData.append("reviewNotes", reviewNotes);
      formData.append("file", file);

      const response = await fetch("/offline/submit", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setResult(data.error || "Error al enviar ticket");
        return;
      }

      setResult(`Ticket enviado correctamente. ID: ${data.submissionId}`);
      setMerchantName("");
      setReviewNotes("");
      setFile(null);
    } catch (error) {
      console.error(error);
      setResult("Error inesperado al enviar el ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: "40px auto", padding: 24 }}>
      <h1>Subir ticket offline</h1>
      <p>Formulario de prueba para el sistema offline.</p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
        <div>
          <label htmlFor="shopDomain">Shop domain</label>
          <input
            id="shopDomain"
            type="text"
            value={shopDomain}
            onChange={(e) => setShopDomain(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label htmlFor="customerId">Customer ID</label>
          <input
            id="customerId"
            type="text"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label htmlFor="customerEmail">Customer email</label>
          <input
            id="customerEmail"
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label htmlFor="merchantName">Comercio / farmacia</label>
          <input
            id="merchantName"
            type="text"
            value={merchantName}
            onChange={(e) => setMerchantName(e.target.value)}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label htmlFor="reviewNotes">Notas</label>
          <textarea
            id="reviewNotes"
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
            rows={4}
            style={{ width: "100%", padding: 8 }}
          />
        </div>

        <div>
          <label htmlFor="file">Archivo ticket (imagen o PDF)</label>
          <input
            id="file"
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button type="submit" disabled={loading} style={{ padding: "10px 16px" }}>
          {loading ? "Enviando..." : "Enviar ticket"}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 20, padding: 12, border: "1px solid #ccc" }}>
          {result}
        </div>
      )}
    </div>
  );
}