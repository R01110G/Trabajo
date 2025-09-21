import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbXJ5bXNiY25xcnhsdHNteHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzM2MTksImV4cCI6MjA3Mzc0OTYxOX0.Z4puY5w_Gb7GbbpipawQQ755MKsJcJUeyra7-XnL5as";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Contenedor de semanas
const accordion = document.getElementById("accordionSemanas");

// 🔧 Normalizar nombres
function normalizar(nombre) {
  return nombre.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
}

// 🚀 Generar las 16 semanas con preview por semana
for (let i = 1; i <= 16; i++) {
  const semana = `Semana ${i}`;
  accordion.innerHTML += `
    <div class="accordion-item bg-secondary text-white">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed bg-dark text-light" type="button"
          data-bs-toggle="collapse" data-bs-target="#collapse${i}">
          📁 ${semana}
        </button>
      </h2>
      <div id="collapse${i}" class="accordion-collapse collapse"
           data-bs-parent="#accordionSemanas">
        <div class="accordion-body">
          <div class="row">
            <!-- Tabla de archivos -->
            <div class="col-md-6">
              <table class="table table-dark table-sm">
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="archivosSemana${i}">
                  <tr><td colspan="2">⏳ Cargando...</td></tr>
                </tbody>
              </table>
            </div>
            <!-- Preview dentro de la semana -->
            <div class="col-md-6">
              <div id="previewSemana${i}" class="bg-white text-dark p-2 rounded" style="height:300px; overflow:auto;">
                <p class="text-muted">👈 Selecciona un archivo para ver su vista previa aquí.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  cargarArchivos(semana, i);
}

// 📂 Listar archivos y enlazar preview local
async function cargarArchivos(semana, i) {
  const { data, error } = await supabase.storage.from("hola").list(normalizar(semana), { limit: 100 });
  const tbody = document.getElementById(`archivosSemana${i}`);
  const previewLocal = document.getElementById(`previewSemana${i}`);
  tbody.innerHTML = "";

  if (error) {
    tbody.innerHTML = `<tr><td colspan="2">❌ Error: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2">📭 No hay archivos</td></tr>`;
    return;
  }

  data.forEach(file => {
    const publicUrl = supabase.storage.from("hola")
      .getPublicUrl(`${normalizar(semana)}/${file.name}`).data.publicUrl;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${file.name}</td>
      <td>
        <button class="btn btn-sm btn-success me-2">👁️ Ver</button>
        <button class="btn btn-sm btn-primary">⬇️ Descargar</button>
      </td>
    `;
    // Preview solo en esa semana
    row.querySelector(".btn-success").addEventListener("click", () => {
      verArchivoLocal(publicUrl, previewLocal);
    });
    // Descargar archivo
    row.querySelector(".btn-primary").addEventListener("click", () => {
      descargarArchivo(publicUrl, file.name);
    });

    tbody.appendChild(row);
  });
}

// 👀 Previsualización por semana
async function verArchivoLocal(url, contenedor) {
  const ext = url.split(".").pop().toLowerCase();

  if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
    contenedor.innerHTML = `<img src="${url}" class="img-fluid">`;
  } else if (ext === "pdf") {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      contenedor.innerHTML = `<iframe src="${blobUrl}" width="100%" height="300px"></iframe>`;
    } catch (err) {
      contenedor.innerHTML = `<p>❌ No se pudo cargar el PDF: ${err.message}</p>`;
    }
  } else if (["txt","md","json","js","html","css"].includes(ext)) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      contenedor.innerHTML = `<pre>${text}</pre>`;
    } catch (err) {
      contenedor.innerHTML = `<p>❌ No se pudo cargar el archivo de texto: ${err.message}</p>`;
    }
  } else {
    contenedor.innerHTML = `<p>⚠️ No se puede previsualizar este archivo. <a href="${url}" target="_blank">Abrir aquí</a></p>`;
  }
}

// ⬇️ Descargar archivo sin abrir otra página
async function descargarArchivo(url, nombre) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nombre;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (err) {
    alert("❌ Error al descargar: " + err.message);
  }
}
