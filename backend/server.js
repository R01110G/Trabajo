import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbXJ5bXNiY25xcnhsdHNteHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzM2MTksImV4cCI6MjA3Mzc0OTYxOX0.Z4puY5w_Gb7GbbpipawQQ755MKsJcJUeyra7-XnL5as";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 🔹 Ruta para listar archivos del bucket "hola"
app.get("/api/archivos", async (req, res) => {
  const { data, error } = await supabase.storage.from("hola").list("", {
    limit: 100,
    offset: 0,
  });

  if (error) return res.status(500).json({ error: error.message });

  const archivos = data.map((file) => ({
    nombre: file.name,
    url: `${SUPABASE_URL}/storage/v1/object/public/hola/${file.name}`,
  }));

  res.json(archivos);
});

// Puerto del servidor
app.listen(4000, () => {
  console.log("Servidor backend corriendo en http://localhost:4000");
});
