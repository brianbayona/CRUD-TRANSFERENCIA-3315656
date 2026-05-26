document.addEventListener("DOMContentLoaded", () => {
  obtenerTareas();

  const formulario = document.getElementById("formularioTarea");
  formulario.addEventListener("submit", crearTarea);
});

// Cambia 'localhost' por tu IP si estás compartiendo en red local (Ej: 'http://192.168.1.15:3004/task')
const API_URL = 'http://localhost:3004/task';

// --- FUNCIÓN READ ---
function obtenerTareas() {
  fetch(API_URL)
    .then(respuesta => respuesta.json())
    .then(tareas => {
      const listaUL = document.getElementById("listaTareas");
      listaUL.innerHTML = "";

      tareas.forEach(tarea => {
        const li = document.createElement("li");

        // 1. NUEVO: Crear un Checkbox para el estado de la tarea
        const checkboxEstado = document.createElement("input");
        checkboxEstado.type = "checkbox";
        // Si en tu db.json "completada" es true, el checkbox aparecerá marcado
        checkboxEstado.checked = tarea.completada || false; 
        checkboxEstado.className = "checkbox-tarea";
        
        // Evento para cambiar el estado al hacer clic en el checkbox
        checkboxEstado.addEventListener("change", () => {
          cambiarEstadoTarea(tarea.id, checkboxEstado.checked);
        });

        const textoTarea = document.createElement("span");
        textoTarea.textContent = tarea.texto;
        
        // Si la tarea ya está completada, le añadimos una clase para tacharla con CSS
        if (tarea.completada) {
          textoTarea.classList.add("completada");
        }

        const contenedorBotones = document.createElement("div");
        contenedorBotones.className = "acciones-tarea";


        const btnEditar = document.createElement("button");
        btnEditar.textContent = "Editar";
        btnEditar.addEventListener("click", () => {
          actualizarTarea(tarea.id, tarea.texto);
        });

        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => {
          eliminarTarea(tarea.id);
        });

        // Agregamos el checkbox al inicio del elemento de la lista
        li.appendChild(checkboxEstado);
        li.appendChild(textoTarea);
        
        contenedorBotones.appendChild(btnEditar);
        contenedorBotones.appendChild(btnEliminar);
        li.appendChild(contenedorBotones);
        listaUL.appendChild(li);
      });
    })
    .catch(error => console.error("Error al obtener tareas:", error));
}

// --- NUEVA FUNCIÓN: ACTUALIZAR ESTADO (PATCH) ---
function cambiarEstadoTarea(id, nuevoEstado) {
  // Usamos el método PATCH porque solo queremos modificar el campo "completada" sin tocar el texto
  fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ completada: nuevoEstado }),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  })
    .then(respuesta => respuesta.json())
    .then(datosActualizados => {
      console.log(`Estado de la tarea ${id} actualizado:`, datosActualizados);
      obtenerTareas(); // Refrescamos la lista para aplicar o quitar el tachado
    })
    .catch(error => console.error("Error al cambiar el estado:", error));
}

// --- FUNCIÓN CREATE (Modificada para incluir el estado por defecto) ---
function crearTarea(evento) {
  evento.preventDefault();
  const input = document.getElementById("inputTarea");
  const tituloTarea = input.value.trim();

  if (tituloTarea === "") return;

  // Al crear una tarea nueva, por defecto su estado "completada" será false
  const nuevaTarea = { 
    texto: tituloTarea,
    completada: false 
  }; 

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(nuevaTarea),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  })
    .then(respuesta => respuesta.json())
    .then(datosServidor => {
      console.log("Tarea creada:", datosServidor);
      input.value = "";
      obtenerTareas();
    })
    .catch(error => console.error("Error al crear la tarea:", error));
}

// --- FUNCIÓN UPDATE ---
function actualizarTarea(id, tituloActual) {
  const nuevoTitulo = prompt("Modifica el nombre de la tarea:", tituloActual);

  if (nuevoTitulo === null || nuevoTitulo.trim() === "") return;

  const tareaActualizada = {
    texto: nuevoTitulo.trim()
  };

  fetch(`${API_URL}/${id}`, {
    method: 'PATCH', // Cambiado a PATCH para que no borre el estado de "completada" al editar el texto
    body: JSON.stringify(tareaActualizada),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  })
    .then(respuesta => respuesta.json())
    .then(datosActualizados => {
      console.log(`Tarea ${id} modificada:`, datosActualizados);
      obtenerTareas();
    })
    .catch(error => console.error("Error al actualizar la tarea:", error));
}

// --- FUNCIÓN DELETE ---
function eliminarTarea(id) {
  fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  })
    .then(respuesta => {
      if (respuesta.ok) {
        console.log(`Tarea con ID ${id} eliminada.`);
        obtenerTareas();
      }
    })
    .catch(error => console.error("Error al eliminar la tarea:", error));
}
// --- FUNCIÓN UPDATE (Actualizar tarea) ---
function actualizarTarea(id, tituloActual) {
  // 1. Permite cambiar el nombre de una tarea con un prompt
  const nuevoTitulo = prompt("Modifica el nombre de la tarea:", tituloActual);

  // Validación: Si el usuario cancela el prompt o lo deja vacío, detenemos la función
  if (nuevoTitulo === null || nuevoTitulo.trim() === "") return;

  // Creamos el objeto solo con el campo que queremos modificar
  const tareaActualizada = {
    texto: nuevoTitulo.trim()
  };

  // 2. Envía una petición PATCH al servidor local apuntando al ID específico
  fetch(`${API_URL}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(tareaActualizada),
    headers: { 'Content-type': 'application/json; charset=UTF-8' },
  })
    .then(respuesta => {
      if (!respuesta.ok) {
        throw new Error("No se pudo actualizar la tarea en el servidor");
      }
      return respuesta.json();
    })
    .then(datosActualizados => {
      console.log(`Servidor responde a PATCH (Tarea ${id} modificada):`, datosActualizados);

      // 3. Refresca la información mostrada llamando de nuevo a la lista
      obtenerTareas();
    })
    .catch(error => console.error("Error al actualizar la tarea:", error));
}