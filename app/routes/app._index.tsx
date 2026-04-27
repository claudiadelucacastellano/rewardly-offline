export default function Index() {
  return (
    <div>
      <h1 style={{ marginBottom: 8 }}>Rewardly Offline</h1>
      <p style={{ color: "#666", maxWidth: 680 }}>
        Revisa tickets de compra offline, apruébalos manualmente y asigna puntos a clientes.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginTop: 28 }}>
        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 18 }}>
          <h3>Tickets pendientes</h3>
          <p>Revisa tickets enviados desde la landing.</p>
        </div>

        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 18 }}>
          <h3>Aprobar puntos</h3>
          <p>Asigna puntos reales al cliente tras validar el ticket.</p>
        </div>

        <div style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 18 }}>
          <h3>Historial</h3>
          <p>Los movimientos quedan guardados en la base de datos compartida.</p>
        </div>
      </div>
    </div>
  );
}