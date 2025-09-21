import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbXJ5bXNiY25xcnhsdHNteHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzM2MTksImV4cCI6MjA3Mzc0OTYxOX0.Z4puY5w_Gb7GbbpipawQQ755MKsJcJUeyra7-XnL5as";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 📌 Contenedores
const form = document.getElementById("formUpload");
const estado = document.getElementById("estado");
const listaArchivos = document.getElementById("listaArchivos");
const semanaSelect = document.getElementById("semana");
const filtroSemana = document.getElementById("filtroSemana");
const preview = document.getElementById("preview");

// 🔹 Generar 16 semanas en los selects
for (let i = 1; i <= 16; i++) {
  const option1 = document.createElement("option");
  option1.value = `Semana_${i}`;
  option1.textContent = `Semana ${i}`;
  semanaSelect.appendChild(option1);

  const option2 = document.createElement("option");
  option2.value = `Semana_${i}`;
  option2.textContent = `Semana ${i}`;
  filtroSemana.appendChild(option2);
}

// 🔧 Normalizar nombres de archivos
function normalizar(nombre) {
  return nombre.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "");
}

// 📤 Subir archivo
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const archivo = document.getElementById("archivo").files[0];
  const curso = document.getElementById("curso").value.trim();
  const semana = semanaSelect.value;

  if (!archivo || !curso) {
    estado.textContent = "⚠️ Selecciona un archivo y escribe el curso.";
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

  // 🔄 Agregar fila directamente a la tabla si coincide con la semana filtrada
  if (filtroSemana.value === semana) {
    agregarFilaArchivo(archivo.name, curso, semana, filePath);
  }
});

// 📂 Función para agregar fila dinámica
function agregarFilaArchivo(nombreArchivo, curso, semana, filePath) {
  const { data: urlData } = supabase.storage.from("hola").getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // Fecha desde timestamp en el nombre del archivo
  const timestamp = parseInt(filePath.split("/")[1].split("_")[0]);
  const fecha = new Date(timestamp).toLocaleString();

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${nombreArchivo}</td>   <!-- Nombre del archivo -->
    <td>${curso}</td>            <!-- Curso -->
    <td>${semana}</td>           <!-- Semana -->
    <td>${fecha}</td>            <!-- Fecha -->
    <td>
      <button class="btn btn-sm btn-outline-success me-2">👁️ Ver</button>
      <a href="${publicUrl}" download class="btn btn-sm btn-outline-primary me-2">⬇️ Descargar</a>
      <button class="btn btn-sm btn-outline-danger">🗑️ Borrar</button>
    </td>
  `;

  // Previsualizar al hacer clic en "Ver"
  row.querySelector(".btn-outline-success").addEventListener("click", () => {
    verArchivo(publicUrl);
  });

  // Borrar archivo
  row.querySelector(".btn-outline-danger").addEventListener("click", async () => {
    if (!confirm("¿Seguro que deseas borrar este archivo?")) return;
    const { error } = await supabase.storage.from("hola").remove([filePath]);
    if (error) alert("❌ Error al borrar: " + error.message);
    else row.remove();
  });

  listaArchivos.appendChild(row);
}

// 📂 Listar archivos de la semana seleccionada
async function listarArchivos(semana) {
  listaArchivos.innerHTML = `<tr><td colspan="5" class="text-center text-info">⏳ Cargando...</td></tr>`;
  preview.innerHTML = `<p class="text-muted">Selecciona un archivo para previsualizar.</p>`;

  try {
    const { data, error } = await supabase.storage.from("hola").list(semana, { limit: 100 });

    if (error) {
      listaArchivos.innerHTML = `<tr><td colspan="5" class="text-danger">❌ Error: ${error.message}</td></tr>`;
      return;
    }

    if (!data || data.length === 0) {
      listaArchivos.innerHTML = `<tr><td colspan="5" class="text-muted">📭 No hay archivos en esta semana</td></tr>`;
      return;
    }

    listaArchivos.innerHTML = "";

    for (const file of data) {
      // Por ahora curso predeterminado, puedes usar metadata si quieres
      agregarFilaArchivo(file.name, "Nombre del curso", semana, `${semana}/${file.name}`);
    }
  } catch (err) {
    listaArchivos.innerHTML = `<tr><td colspan="5" class="text-danger">⚠️ Error inesperado: ${err.message}</td></tr>`;
  }
}

// 👀 Previsualización global
window.verArchivo = (url) => {
  const ext = url.split(".").pop().toLowerCase();
  if (["jpg","jpeg","png","gif","webp"].includes(ext)) {
    preview.innerHTML = `<img src="${url}" class="img-fluid">`;
  } else if (ext === "pdf") {
    preview.innerHTML = `<iframe src="${url}" width="100%" height="300px"></iframe>`;
  } else {
    preview.innerHTML = `<p>No se puede previsualizar este archivo.<br><a href="${url}" target="_blank">Abrir aquí</a></p>`;
  }
};

// 🔄 Actualizar listado cuando se cambia el filtro
filtroSemana.addEventListener("change", () => {
  listarArchivos(filtroSemana.value);
});

// Listar archivos al cargar la página
listarArchivos(filtroSemana.value);
