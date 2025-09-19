import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Configuración Supabase
const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUI";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("formUpload");
const estado = document.getElementById("estado");

// Normalizar solo el nombre del archivo, no la carpeta
function sanitizeFileName(name) {
  return name.normalize("NFD")
             .replace(/[\u0300-\u036f]/g, "")
             .replace(/\s+/g, "_")
             .replace(/[^a-zA-Z0-9._-]/g, "_");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const archivo = document.getElementById("archivo").files[0];
  const semana = document.getElementById("semana").value; // nombre exacto: Semana 1, Semana 2...

  if (!archivo) return estado.textContent = "⚠ Selecciona un archivo";

  estado.textContent = "⏳ Subiendo...";

  // Carpeta = nombre exacto de la semana
  const filePath = `${semana}/${Date.now()}_${sanitizeFileName(archivo.name)}`;
  const { error } = await supabase.storage.from("hola").upload(filePath, archivo);

  if (error) {
    estado.textContent = "❌ Error al subir: " + error.message;
  } else {
    estado.textContent = "✅ Archivo subido correctamente";
    form.reset();
  }
});
