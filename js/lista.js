import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const filtroSemana = document.getElementById("filtroSemana");
const listaArchivos = document.getElementById("listaArchivos");
const previewDiv = document.getElementById("preview");

// Mostrar vista previa
function mostrarPreview(url, name) {
  let content = "";
  if (name.endsWith(".pdf")) content = `<iframe src="${url}" title="PDF"></iframe>`;
  else if (name.match(/\.(jpg|jpeg|png|gif)$/i)) content = `<img src="${url}" class="img-fluid rounded shadow" alt="Imagen">`;
  else if (name.match(/\.(mp4|webm)$/i)) content = `<video src="${url}" controls class="w-100 rounded shadow"></video>`;
  else if (name.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i)) content = `<iframe src="https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true" title="Office"></iframe>`;
  else content = `<div class="text-center text-muted">📄 No hay vista previa.<br><a href="${url}" target="_blank" class="btn btn-primary mt-3">Abrir archivo</a></div>`;
  previewDiv.innerHTML = content;
}

// Listar archivos por semana
async function cargarArchivos() {
  const semana = filtroSemana.value; // nombre exacto
  const { data, error } = await supabase.storage.from("hola").list(semana, { limit: 100 });
  listaArchivos.innerHTML = "";

  if (error) return listaArchivos.innerHTML = `<tr><td colspan="2">❌ ${error.message}</td></tr>`;
  if (!data || data.length === 0) return listaArchivos.innerHTML = `<tr><td colspan="2">⚠️ No hay archivos en ${semana}</td></tr>`;

  for (const file of data) {
    const { data: urlData } = supabase.storage.from("hola").getPublicUrl(`${semana}/${file.name}`);
    const publicUrl = urlData?.publicUrl || "#";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${file.name}</td>
      <td>
        <button class="btn btn-primary btn-sm ver-btn">👁 Ver</button>
        <a href="${publicUrl}" target="_blank" class="btn btn-success btn-sm">⬇ Descargar</a>
      </td>
    `;
    row.querySelector(".ver-btn").addEventListener("click", () => mostrarPreview(publicUrl, file.name));
    listaArchivos.appendChild(row);
  }
}

// Cambiar semana
filtroSemana.addEventListener("change", cargarArchivos);

// Cargar inicial
cargarArchivos();
