// ===============================
// main.js — maneja index, semana, login y subida simulada
// ===============================

// -------------------------------
// Helpers
// -------------------------------
async function loadServerData() {
  try {
    const res = await axios.get("js/data.json");
    return res.data.semanas || {};
  } catch (e) {
    console.error("No se pudo cargar js/data.json:", e);
    return {};
  }
}

function getLocalUploads() {
  const raw = localStorage.getItem("uploadedFiles");
  return raw ? JSON.parse(raw) : {}; 
}

function saveLocalUploads(obj) {
  localStorage.setItem("uploadedFiles", JSON.stringify(obj));
}

// -------------------------------
// Index: listar semanas
// -------------------------------
async function renderIndex() {
  const el = document.getElementById("weeksList");
  if (!el) return;

  const server = await loadServerData();
  const local = getLocalUploads();

  const weeks = new Set([...Object.keys(server), ...Object.keys(local)]);

  if (weeks.size === 0) {
    el.innerHTML = "<p class='text-center text-muted'>No hay semanas definidas.</p>";
    return;
  }

  let html = `<div class="row g-4 justify-content-center">`;
  Array.from(weeks)
    .sort((a, b) => a - b)
    .forEach((w) => {
      const countServer = (server[w] || []).length;
      const countLocal = (local[w] || []).length;
      const total = countServer + countLocal;

      html += `
        <div class="col-md-4">
          <div class="card bg-dark text-light border-neon shadow-lg h-100">
            <div class="card-body text-center">
              <h4 class="card-title text-neon">Semana ${w}</h4>
              <p class="card-text text-muted">${total} archivo(s) disponible(s)</p>
              <a href="semana.html?semana=${w}" class="btn btn-neon w-100">
                Ver trabajos
              </a>
            </div>
          </div>
        </div>
      `;
    });
  html += "</div>";
  el.innerHTML = html;
}

// -------------------------------
// Semana: mostrar archivos
// -------------------------------
async function renderSemana() {
  const el = document.getElementById("listaTrabajos");
  const title = document.getElementById("tituloSemana");
  if (!el || !title) return;

  const params = new URLSearchParams(window.location.search);
  const semana = params.get("semana") || "1";
  title.textContent = `Trabajos - Semana ${semana}`;

  const server = await loadServerData();
  const local = getLocalUploads();
  const items = [...(server[semana] || []), ...(local[semana] || [])];

  if (items.length === 0) {
    el.innerHTML = `<div class="alert alert-dark text-center border-neon">
      🚫 No hay trabajos para esta semana.
    </div>`;
    return;
  }

  let html = `<div class="row g-4">`;
  items.forEach((t) => {
    let icon = "📎";
    if (t.tipo === "pdf") icon = "📄";
    else if (t.tipo === "word") icon = "📝";
    else if (t.tipo === "image") icon = "🖼";

    html += `
      <div class="col-md-4">
        <div class="card bg-dark text-light border-neon shadow-lg h-100">
          <div class="card-body d-flex flex-column justify-content-between">
            <h5 class="card-title text-neon">${icon} ${t.nombre}</h5>
            <div class="mt-3">
              ${
                t.tipo === "pdf"
                  ? `<a href="${t.archivo}" target="_blank" class="btn btn-neon w-100 mb-2">Ver PDF</a>
                     <a href="${t.archivo}" download class="btn btn-outline-neon w-100">Descargar</a>`
                  : t.tipo === "word"
                  ? `<a href="${t.archivo}" download class="btn btn-neon w-100">Descargar Word</a>`
                  : t.tipo === "image"
                  ? `<a href="${t.archivo}" target="_blank" class="btn btn-neon w-100">Abrir Imagen</a>`
                  : `<a href="${t.archivo}" target="_blank" class="btn btn-neon w-100">Abrir</a>`
              }
            </div>
          </div>
        </div>
      </div>
    `;
  });
  html += "</div>";
  el.innerHTML = html;
}

// -------------------------------
// Login (con InfinityFree)
// -------------------------------
async function loginApi(usuario, password) {
  try {
    const res = await fetch("https://r01116domar.xo.je/api/login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, password })
    });
    return await res.json();
  } catch (err) {
    console.error("Error en fetch:", err);
    return { success: false, message: "⚠️ Error de conexión con el servidor." };
  }
}


// -------------------------------
// Panel estudiante: subir archivo
// -------------------------------
function setupStudentUpload() {
  const form = document.getElementById("uploadForm");
  if (!form) return;

  const status = document.getElementById("localUploads");

  const refreshLocalList = () => {
    const local = getLocalUploads();
    const html = Object.keys(local)
      .sort((a, b) => a - b)
      .map((s) => {
        const items = local[s];
        return `<h4 class="text-neon">Semana ${s} (${items.length})</h4>` +
               items.map(i => `<div class="text-light">• ${i.nombre}</div>`).join("");
      })
      .join("");
    status.innerHTML = html || "<p class='text-muted'>No hay subidas locales.</p>";
  };

  refreshLocalList();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const week = document.getElementById("semana").value;
    const fileInput = document.getElementById("archivo");
    if (!fileInput.files.length) return alert("Selecciona un archivo.");

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(ev) {
      const dataURL = ev.target.result;
      let tipo = "word";
      if (file.type === "application/pdf") tipo = "pdf";
      else if (file.type.startsWith("image/")) tipo = "image";

      const local = getLocalUploads();
      if (!local[week]) local[week] = [];
      local[week].push({
        nombre: file.name,
        archivo: dataURL,
        tipo
      });

      saveLocalUploads(local);
      alert("✅ Archivo guardado localmente (prueba). Para hacerlo permanente, cópialo en 'archivos/semanaX' y actualiza js/data.json en el repo.");
      refreshLocalList();
      form.reset();
    };
    reader.readAsDataURL(file);
  });
}

// -------------------------------
// Auto-run según la página
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
  setupLogin();

  const path = window.location.pathname;

  if (path.endsWith("index.html") || path === "/" || path.endsWith("/mis-chambas/")) {
    renderIndex();
  }

  if (path.endsWith("semana.html")) {
    renderSemana();
  }

  if (path.endsWith("estudiante.html")) {
    if (!localStorage.getItem("isLogged")) {
      alert("Debes iniciar sesión primero.");
      window.location.href = "login.html";
    } else {
      setupStudentUpload();
    }
  }
});
