export default function SetupPage() {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ margin: "0 0 8px", color: "#667085", fontWeight: 700 }}>
          Rewardly Offline
        </p>

        <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1 }}>
          Activar landing de tickets offline
        </h1>

        <p style={{ color: "#667085", marginTop: 12, fontSize: 16, maxWidth: 720 }}>
          Crea una página en Shopify para que tus clientes puedan subir tickets de compra
          y acumular puntos en su cuenta.
        </p>
      </div>

      <div style={{ display: "grid", gap: 18 }}>
        <Step
          number="1"
          title="Crear una página en Shopify"
          text='Ve a "Tienda online → Páginas" y crea una página llamada, por ejemplo, "Subir ticket".'
        />

        <Step
          number="2"
          title="Añadir un bloque Custom Liquid"
          text='Desde el editor del tema, entra en esa página y añade una sección de "Custom Liquid" o "Líquido personalizado".'
        />

        <Step
          number="3"
          title="Pegar el código de la landing"
          text="Copia el siguiente código y pégalo dentro del bloque Custom Liquid."
        />

        <CodeBlock />

        <div
          style={{
            marginTop: 8,
            padding: 18,
            borderRadius: 16,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            color: "#344054",
          }}
        >
          <strong>Consejo:</strong> usa esta página en QR físicos, campañas o emails para que
          los clientes puedan enviar sus tickets después de comprar en tienda.
        </div>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
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
      <div
        style={{
          display: "inline-flex",
          width: 30,
          height: 30,
          borderRadius: 999,
          background: "#111827",
          color: "#fff",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          marginBottom: 12,
        }}
      >
        {number}
      </div>

      <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>{title}</h3>
      <p style={{ margin: 0, color: "#667085", lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

function CodeBlock() {
  const landingCode = String.raw`

    {% if customer == nil %}
    <div style="padding:40px;text-align:center;">
        <h2>Inicia sesión para subir tu ticket</h2>
        <p>Necesitas estar logueado para enviar un ticket y acumular puntos.</p>
        <a href="/account/login?return_url={{ shop.url | append: '/pages/subir-ticket' | url_encode }}">Iniciar sesión</a>
    </div>
    {% else %}

    <style>
    .rewardly-ticket-card {
        max-width: 560px;
        margin: 0 auto 60px;
        padding: 32px;
        border: 1px solid #e6e6e6;
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 8px 30px rgba(0,0,0,.06);
        text-align: left;
    }

    .rewardly-ticket-card h2 {
        margin: 0 0 10px;
        font-size: 28px;
        line-height: 1.2;
    }

    .rewardly-ticket-card p {
        margin: 0 0 22px;
        color: #666;
        font-size: 15px;
    }

    .rewardly-file-box {
        padding: 22px;
        border: 1.5px dashed #cfcfcf;
        border-radius: 14px;
        background: #fafafa;
        margin-bottom: 18px;
    }

    .rewardly-file-box input {
        width: 100%;
        font-size: 14px;
    }

    .rewardly-btn {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        min-height: 44px;
        padding: 0 22px;
        border: 0;
        border-radius: 999px;
        background: #111;
        color: #fff !important;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
    }

    .rewardly-btn:disabled {
        opacity: .55;
        cursor: not-allowed;
    }

    #status {
        min-height: 24px;
        margin-top: 16px;
    }
    </style>

    <div class="rewardly-ticket-card" id="offline-app">
    <h2>Sube tu ticket</h2>
    <p>Adjunta una foto o PDF de tu ticket. Lo revisaremos y añadiremos los puntos a tu cuenta.</p>

    <form id="ticket-form">
        <div class="rewardly-file-box">
        <input type="file" id="file" accept="image/*,application/pdf" required>
    <div id="preview" style="margin-top:12px;"></div>
        </div>

        <p>Formatos permitidos: JPG, PNG o PDF (máx. 10MB)</p>

        <button class="rewardly-btn" type="submit">Enviar ticket</button>
    </form>

    <p id="status"></p>
    </div>

    <script>
    const customerId = {{ customer.id | json }};
    const customerEmail = {{ customer.email | json }};
    const shopDomain = "{{ shop.permanent_domain }}";

    const form = document.getElementById("ticket-form");
    const fileInput = document.getElementById("file");
    fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    const preview = document.getElementById("preview");

    if (!file) {
        preview.innerHTML = "";
        return;
    }

    if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        preview.innerHTML = '<img src="' + url + '" style="max-width:100%; border-radius:10px; margin-top:10px;" />';
    } else {
        preview.innerHTML = '<p style="margin-top:10px;">📄 ' + file.name + '</p>';
    }
    });
    const status = document.getElementById("status");

    function setLoading(isLoading) {
        const button = form.querySelector("button");
        button.disabled = isLoading;
        button.innerText = isLoading ? "Subiendo..." : "Enviar ticket";
    }

    function showStatus(message, type = "info") {
    status.innerHTML = message;

    status.style.padding = "10px 14px";
    status.style.borderRadius = "10px";
    status.style.fontSize = "14px";

    if (type === "success") {
        status.style.background = "#ecfdf3";
        status.style.color = "#027a48";
    } else if (type === "error") {
        status.style.background = "#fef3f2";
        status.style.color = "#b42318";
    } else {
        status.style.background = "#f2f4f7";
        status.style.color = "#344054";
    }
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        if (!fileInput.files.length) {
        showStatus("Selecciona un archivo.", "error");
        return;
        }

        const file = fileInput.files[0];

        if (file.size > 10 * 1024 * 1024) {
        showStatus("El archivo es demasiado grande (máx 10MB).", "error");
        return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("customerId", customerId);
        formData.append("customerEmail", customerEmail);
        formData.append("shopDomain", shopDomain);

        setLoading(true);
        showStatus("Subiendo ticket...");

        try {
        const res = await fetch("/apps/rewardly-offline/offline/submit", {
            method: "POST",
            body: formData,
            headers: { Accept: "application/json" },
        });

        const data = await res.json();

        if (res.status === 409) {
            showStatus("Este ticket ya ha sido enviado.", "error");
            return;
        }

        if (!res.ok || !data.ok) {
            showStatus(data.error || "Error al subir el ticket.", "error");
            return;
        }

        showStatus("✔ Ticket enviado. Lo revisaremos en breve.", "success");
    form.style.display = "none";
        fileInput.value = "";
        } catch (err) {
        showStatus("Error de conexión. Inténtalo de nuevo.", "error");
        } finally {
        setLoading(false);
        }
    });
    </script>

    {% endif %}
`;

  return (
    <div
      style={{
        borderRadius: 18,
        background: "#111827",
        color: "#fff",
        padding: 20,
        overflowX: "auto",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{landingCode}</pre>
    </div>
  );
}