import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 🔑 Configuración Supabase
const SUPABASE_URL = "https://bkmrymsbcnqrxltsmxxm.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbXJ5bXNiY25xcnhsdHNteHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzM2MTksImV4cCI6MjA3Mzc0OTYxOX0.Z4puY5w_Gb7GbbpipawQQ755MKsJcJUeyra7-XnL5as";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const form = document.getElementById("loginForm");
const errorMessage = document.getElementById("errorMessage");
const googleLoginBtn = document.getElementById("googleLogin");

// 🟢 Login con correo y contraseña simplificado
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    errorMessage.style.display = "block";
    errorMessage.textContent = "⚠ Por favor ingresa correo y contraseña.";
    return;
  }

  errorMessage.style.display = "block";
  errorMessage.textContent = "Verificando...";
  errorMessage.style.color = "gray";

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // ✅ Login correcto → redirigir al index
    errorMessage.textContent = "✅ Bienvenido, redirigiendo...";
    errorMessage.style.color = "green";
    setTimeout(() => (window.location.href = "index.html"), 1500);

  } catch (err) {
    console.error("Error al iniciar sesión:", err);
    errorMessage.style.display = "block";
    errorMessage.textContent = "⚠ Correo o contraseña incorrectos.";
    errorMessage.style.color = "red";
  }
});

// 🔵 Login con Google simplificado
googleLoginBtn.addEventListener("click", async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "index.html",
      },
    });

    if (error) throw error;
    // Supabase gestiona la redirección automáticamente
  } catch (err) {
    console.error("Error con Google:", err);
    errorMessage.style.display = "block";
    errorMessage.textContent = "⚠ Error con Google: " + err.message;
    errorMessage.style.color = "red";
  }
});
