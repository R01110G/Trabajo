
  import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

  // 🔑 Configuración Supabase
  const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbXJ5bXNiY25xcnhsdHNteHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzM2MTksImV4cCI6MjA3Mzc0OTYxOX0.Z4puY5w_Gb7GbbpipawQQ755MKsJcJUeyra7-XnL5as";

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const form = document.getElementById("formUpload");
  const estado = document.getElementById("estado");
  const listaArchivos = document.getElementById("listaArchivos");
  const filtroSemana = document.getElementById("filtroSemana");

  // 🔧 Normalizar nombres
  function normalizar(nombre) {
    return nombre
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_.-]/g, "");
  }

  // 🔼 Subir archivo
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

    const filePath = `${normalizar(semana)}/${Date.now()}_${normalizar(
      archivo.name
    )}`;

    const { error } = await supabase.storage
      .from("hola") // 👈 tu bucket
      .upload(filePath, archivo);

    if (error) {
      estado.textContent = "❌ Error al subir: " + error.message;
      estado.style.color = "red";
      return;
    }

    estado.textContent = "✅ Archivo subido correctamente.";
    estado.style.color = "lime";
    form.reset();

    cargarArchivos(filtroSemana.value);
  });

  // 📂 Listar archivos con fecha y acciones
  async function cargarArchivos(semana) {
    const { data, error } = await supabase.storage
      .from("hola")
      .list(normalizar(semana), { limit: 100 });

    listaArchivos.innerHTML = "";

    if (error) {
      listaArchivos.innerHTML =
        "<tr><td colspan='3'>❌ Error al listar: " + error.message + "</td></tr>";
      return;
    }

    if (!data || data.length === 0) {
      listaArchivos.innerHTML =
        "<tr><td colspan='3'>📭 No hay archivos en esta semana</td></tr>";
      return;
    }

    data.forEach((file) => {
      const { data: urlData } = supabase.storage
        .from("hola")
        .getPublicUrl(`${normalizar(semana)}/${file.name}`);

      const publicUrl = urlData.publicUrl;

      // 📅 Supabase Storage no siempre devuelve created_at, así que usamos metadata si está disponible
      const fecha = file.created_at
        ? new Date(file.created_at).toLocaleString()
        : "—";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${file.name}</td>
        <td>${fecha}</td>
        <td>
          <a href="${publicUrl}" target="_blank">👁️ Ver</a> |
          <button onclick="borrarArchivo('${normalizar(
            semana
          )}','${file.name}')">🗑️ Borrar</button>
        </td>
      `;
      listaArchivos.appendChild(row);
    });
  }

  // 🗑️ Borrar archivo
  window.borrarArchivo = async (semana, nombre) => {
    if (!confirm("¿Seguro que deseas borrar este archivo?")) return;

    const { error } = await supabase.storage
      .from("hola")
      .remove([`${semana}/${nombre}`]);

    if (error) {
      alert("❌ Error al borrar: " + error.message);
      return;
    }

    alert("✅ Archivo borrado correctamente");
    cargarArchivos(filtroSemana.value);
  };

  // 🎯 Filtro de semana
  filtroSemana.addEventListener("change", () => {
    cargarArchivos(filtroSemana.value);
  });

  // 🚀 Cargar inicial
  cargarArchivos(filtroSemana.value);

