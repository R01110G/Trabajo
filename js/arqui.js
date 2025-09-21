import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "TU_KEY_AQUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Contenedor de semanas
const accordion = document.getElementById("accordionSemanas");
const preview = document.getElementById("preview");

// 🔧 Normalizar nombres
function normalizar(nombre) {
  return nombre.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
}

// 🚀 Generar las 16 semanas
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
      </div>
    </div>
  `;
  cargarArchivos(semana, i);
}

// 📂 Listar archivos
async function cargarArchivos(semana, i) {
  const { data, error } = await supabase.storage.from("hola").list(normalizar(semana), { limit: 100 });

  const tbody = document.getElementById(`archivosSemana${i}`);
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
    const { data: urlData } = supabase.storage.from("hola").getPublicUrl(`${normalizar(semana)}/${file.name}`);
    const publicUrl = urlData.publicUrl;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${file.name}</td>
      <td>
        <button class="btn btn-sm btn-success me-2" onclick="verArchivo('${publicUrl}')">👁️ Ver</button>
        <a href="${publicUrl}" download class="btn btn-sm btn-primary">⬇️ Descargar</a>
      </td>
    `;
    tbody.appendChild(row);
  });
}

// 👀 Ver archivo en la vista previa
window.verArchivo = (url) => {
  const ext = url.split(".").pop().toLowerCase();

  if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
    preview.innerHTML = `<img src="${url}" class="img-fluid">`;
  } else if (["pdf"].includes(ext)) {
    preview.innerHTML = `<iframe src="${url}" width="100%" height="100%"></iframe>`;
  } else if (["txt","md","json","js","html","css"].includes(ext)) {
    fetch(url).then(res => res.text()).then(text => {
      preview.innerHTML = `<pre>${text}</pre>`;
    });
  } else {
    preview.innerHTML = `<p>⚠️ No se puede previsualizar este archivo. <a href="${url}" target="_blank">Abrir aquí</a></p>`;
  }
};
