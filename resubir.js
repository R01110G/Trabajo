import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "TU_ANON_KEY_AQUI"; // tu anon key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Carpeta/bucket
const bucket = "hola";

// Lista de semanas (carpetas)
const semanas = Array.from({ length: 16 }, (_, i) => `Semana_${i + 1}`);

async function resubirArchivos() {
  for (const semana of semanas) {
    // Listar archivos en la carpeta
    const { data: archivos, error } = await supabase.storage.from(bucket).list(semana, { limit: 100 });
    if (error) {
      console.log(`❌ Error listando ${semana}:`, error.message);
      continue;
    }
    if (!archivos || archivos.length === 0) continue;

    for (const file of archivos) {
      try {
        // Descargar archivo existente
        const { data: fileData, error: downloadError } = await supabase.storage.from(bucket).download(`${semana}/${file.name}`);
        if (downloadError) {
          console.log(`❌ Error descargando ${file.name}:`, downloadError.message);
          continue;
        }

        // Convertir a blob y volver a subir
        const blob = await fileData.blob();
        await supabase.storage.from(bucket).upload(`${semana}/${file.name}`, blob, { upsert: true });
        console.log(`✅ Archivo resubido y público: ${semana}/${file.name}`);
      } catch (err) {
        console.log(`⚠️ Error con ${file.name}:`, err.message);
      }
    }
  }
  console.log("✅ Todos los archivos han sido resubidos y deberían ser públicos.");
}

// Ejecutar
resubirArchivos();
