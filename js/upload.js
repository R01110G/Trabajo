import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "TU_KEY_AQUI"; // 👈 pega tu anon key real
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Contenedores
const accordion = document.getElementById("accordionSemanas");
const preview = document.getElementById("preview");
const form = document.getElementById("formUpload");
const estado = document.getElementById("estado");

// 🔧 Normalizar nombres (para archivos)
function normalizar(nombre) {
  return nombre.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
}

// 🚀 Crear acordeón con 16 semanas
for (let i = 1; i <= 16; i++) {
  const semana = `Semana_${i}`; // 👈 ahora todos los nombres de carpetas son consistentes
  accordion.innerHTML += `
    <div class="accordion-item bg-secondary text-white">
      <h2 class="accordion-header">
        <button class="accordion-button collapsed bg-dark text-light fw-bold" type="button"
          data-bs-toggle="collapse" data-bs-target="#collapse${i}">
          📁 ${semana}
        </button>
      </h2>
      <div id="collapse${i}" class="accordion-collapse collapse"
           data-bs-parent="#accordionSemanas">
        <div class="accordion-body">
          <table class="table table-dark table-hover table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>📄 Archivo</th>
                <th class="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody id="archivosSemana${i}">
              <tr><td colspan="2" class="text-center text-muted">👆 Expande para cargar archivos...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  // 👉 Cuando se expanda la semana, cargar archivos
  const collapse = document.getElementById(`collapse${i}`);
  collapse.addEventListener("show.bs.collapse", () => {
    cargarArchivos(semana, i);
  });
}

// 📤 Subir archivo
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const archivo = document.getElementById("archivo").files[0];
  const semana = document.getElementById("semana").value;

  if (!archivo) {
    estado.textContent = "⚠️ Selecciona un archivo.";
    estado.style.color = "yellow";
    return;
  }

  estado.textContent = "⏳ Subiendo...";
  estado.style.color = "orange";

  const filePath = `${semana}/${Date.now()}_${normalizar(archivo.name)}`;

  const { error } = await supabase.storage.from("hola").upload(filePath, archivo);

  if (error) {
    estado.textContent = "❌ Error al subir: " + error.message;
    estado.style.color = "red";
    return;
  }

  estado.textContent = "✅ Archivo subido correctamente.";
  estado.style.color = "lime";
  form.reset();

  // 🔄 refrescar tabla de la semana correspondiente
  const semanaIndex = semana.split("_")[1];
  cargarArchivos(semana, semanaIndex);
});

// 📂 Listar archivos de cada semana
async function cargarArchivos(semana, i) {
  const tbody = document.getElementById(`archivosSemana${i}`);
  tbody.innerHTML = `<tr><td colspan="2" class="text-center text-info">⏳ Cargando...</td></tr>`;

  try {
    const { data, error } = await supabase.storage
      .from("hola")
      .list(semana, { limit: 100 });

    if (error) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-danger">❌ Error: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" class="text-muted">📭 No hay archivos en esta semana</td></tr>`;
      return;
    }

    tbody.innerHTML = "";
    for (const file of data) {
      const { data: urlData } = supabase.storage
        .from("hola")
        .getPublicUrl(`${semana}/${file.name}`);
      const publicUrl = urlData.publicUrl;

      // 📅 Fecha a partir del timestamp del nombre
      let fecha = "—";
      const timestamp = file.name.split("_")[0];
      if (!isNaN(timestamp)) {
        fecha = new Date(parseInt(timestamp)).toLocaleString();
      }

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${file.name} <br><small class="text-muted">${fecha}</small></td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-success me-2" onclick="verArchivo('${publicUrl}','${file.name}')">👁️ Ver</button>
          <a href="${publicUrl}" download class="btn btn-sm btn-outline-primary me-2">⬇️ Descargar</a>
          <button class="btn btn-sm btn-outline-danger" onclick="borrarArchivo('${semana}','${file.name}',${i})">🗑️ Borrar</button>
        </td>
      `;
      tbody.appendChild(row);
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="2" class="text-danger">⚠️ Error inesperado: ${err.message}</td></tr>`;
  }
}

// 🗑️ Borrar archivo
window.borrarArchivo = async (semana, nombre, i) => {
  if (!confirm("¿Seguro que deseas borrar este archivo?")) return;

  const { error } = await supabase.storage.from("hola").remove([`${semana}/${nombre}`]);

  if (error) {
    alert("❌ Error al borrar: " + error.message);
    return;
  }

  alert("✅ Archivo borrado correctamente");
  cargarArchivos(semana, i);
};

// 👀 Vista previa dentro de la misma página
window.verArchivo = (url, name) => {
  preview.innerHTML = `<p class="text-info">⏳ Cargando vista previa de <b>${name}</b>...</p>`;

  const ext = name.split(".").pop().toLowerCase();

  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
    preview.innerHTML = `<img src="${url}" class="img-fluid rounded shadow">`;
  } else if (ext === "pdf") {
    preview.innerHTML = `<iframe src="${url}" width="100%" height="500px" style="border:none;" class="w-100 rounded shadow"></iframe>`;
  } else if (["txt", "html", "css", "js", "json", "md"].includes(ext)) {
    fetch(url)
      .then(res => res.text())
      .then(text => {
        preview.innerHTML = `<pre class="p-3 bg-light rounded shadow text-dark" style="max-height:500px; overflow:auto; white-space:pre-wrap;">${text}</pre>`;
      })
      .catch(() => {
        preview.innerHTML = `<p class="text-danger">⚠️ No se pudo mostrar el archivo. <a href="${url}" target="_blank">Abrir aquí</a></p>`;
      });
  } else {
    preview.innerHTML = `<p class="text-muted">⚠️ No se puede previsualizar este archivo.<br><a href="${url}" target="_blank">Abrir en nueva pestaña</a></p>`;
  }
};
