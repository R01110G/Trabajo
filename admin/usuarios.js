import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  "https://bkmrymsbcnqrxltsmxxm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrbXJ5bXNiY25xcnhsdHNteHhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxNzM2MTksImV4cCI6MjA3Mzc0OTYxOX0.Z4puY5w_Gb7GbbpipawQQ755MKsJcJUeyra7-XnL5as"
);

const usuariosTable = document.getElementById("usuariosTable");
const userModal = document.getElementById("userModal");
const modalTitle = document.getElementById("modalTitle");
const userForm = document.getElementById("userForm");
const crearUsuarioBtn = document.getElementById("crearUsuarioBtn");
const cancelBtn = document.getElementById("cancelBtn");

const userIdInput = document.getElementById("userId");
const userEmailInput = document.getElementById("userEmail");
const userRoleInput = document.getElementById("userRole");
const userPasswordInput = document.getElementById("userPassword");

// 🔹 Cargar usuarios
async function cargarUsuarios() {
  const { data: users } = await supabase.from("profiles").select("*");
  usuariosTable.innerHTML = "";
  users.forEach(user => {
    usuariosTable.innerHTML += `
      <tr>
        <td class="p-3 border">${user.id}</td>
        <td class="p-3 border">${user.email}</td>
        <td class="p-3 border">${user.role}</td>
        <td class="p-3 border space-x-2">
          <button class="editarUsuarioBtn bg-yellow-400 px-2 py-1 rounded-lg">Editar</button>
          <button class="eliminarUsuarioBtn bg-red-500 px-2 py-1 rounded-lg text-white">Eliminar</button>
        </td>
      </tr>
    `;
  });

  // Añadir eventos a los botones
  document.querySelectorAll(".editarUsuarioBtn").forEach((btn, i) => {
    btn.addEventListener("click", () => abrirModal(users[i]));
  });

  document.querySelectorAll(".eliminarUsuarioBtn").forEach((btn, i) => {
    btn.addEventListener("click", () => eliminarUsuario(users[i].id));
  });
}

// 🔹 Abrir modal para crear/editar
function abrirModal(user = null) {
  userModal.classList.remove("hidden");
  if (user) {
    modalTitle.textContent = "Editar Usuario";
    userIdInput.value = user.id;
    userEmailInput.value = user.email;
    userRoleInput.value = user.role;
    userPasswordInput.value = "";
  } else {
    modalTitle.textContent = "Crear Usuario";
    userIdInput.value = "";
    userEmailInput.value = "";
    userRoleInput.value = "";
    userPasswordInput.value = "";
  }
}

// 🔹 Cerrar modal
cancelBtn.addEventListener("click", () => userModal.classList.add("hidden"));

// 🔹 Guardar usuario
userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = userIdInput.value;
  const email = userEmailInput.value;
  const role = userRoleInput.value;
  const password = userPasswordInput.value;

  if (id) {
    // Editar
    await supabase.from("profiles").update({ email, role }).eq("id", id);
  } else {
    // Crear
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });
    if (error) {
      alert(error.message);
      return;
    }
    await supabase.from("profiles").insert([{ id: data.user.id, email, role }]);
  }

  userModal.classList.add("hidden");
  cargarUsuarios();
});

// 🔹 Eliminar usuario
async function eliminarUsuario(id) {
  if (!confirm("¿Seguro quieres eliminar este usuario?")) return;
  await supabase.from("profiles").delete().eq("id", id);
  // ⚠️ OJO: eliminar auth.user necesita clave de servicio en backend
  cargarUsuarios();
}

// Cargar tabla al inicio
cargarUsuarios();
