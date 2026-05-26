const API_URL = "http://192.168.1.40:3002";

const userIdInput = document.getElementById('userId');
const btnSearch = document.getElementById('btnSearch');
const userInfo = document.getElementById('userInfo');
const taskFormContainer = document.getElementById('taskFormContainer');
const taskForm = document.getElementById('taskForm');
const taskTableBody = document.getElementById('taskTableBody');
const taskCount = document.getElementById('taskCount');
const emptyState = document.getElementById('emptyState');
const toastContainer = document.getElementById('toastContainer');

let currentUser = null;
let tasks = [];

function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function isValidInput(value) {
    return value && value.trim().length > 0;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    toast.innerHTML = `
        <span>${icons[type] || ''} ${message}</span>
        <button class="toast__close">&times;</button>
    `;
    toast.querySelector('.toast__close').addEventListener('click', () => toast.remove());
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function clearFieldErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form__input.error').forEach(el => el.classList.remove('error'));
}

function showFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const errorEl = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (errorEl) errorEl.textContent = message;
}

function showUserInfo(user) {
    userInfo.innerHTML = `
        <div class="user-feedback user-feedback--success">
            <strong>✅ Usuario encontrado:</strong><br>
            <strong>Nombre:</strong> ${user.name}<br>
            <strong>Rol:</strong> ${user.rol}<br>
            <strong>Ficha:</strong> ${user.ficha}
        </div>
    `;
}

function showUserNotFound() {
    userInfo.innerHTML = `
        <div class="user-feedback user-feedback--error">
            ❌ El usuario no está registrado en el sistema.
        </div>
    `;
    taskFormContainer.style.display = 'none';
}

function showValidationError(message) {
    userInfo.innerHTML = `
        <div class="user-feedback user-feedback--warning">
            ⚠️ ${message}
        </div>
    `;
}

function clearUserInfo() {
    userInfo.innerHTML = '';
    taskFormContainer.style.display = 'none';
    currentUser = null;
    tasks = [];
    taskTableBody.innerHTML = '';
    updateTaskCount();
    showEmptyState();
}

function enableTaskForm() {
    taskFormContainer.style.display = 'block';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
}

function showEmptyState() {
    if (tasks.length === 0) {
        emptyState.style.display = 'block';
    }
}

function updateTaskCount() {
    taskCount.textContent = tasks.length === 1 ? "1 tarea" : `${tasks.length} tareas`;
}

const statusColors = {
    'Pendiente': '#ffc107',
    'En progreso': '#17a2b8',
    'Completada': '#28a745'
};

function createTaskElement(task) {
    const row = document.createElement('tr');
    row.style.animation = 'fadeIn 0.3s ease';
    row.dataset.taskId = task.id;

    row.innerHTML = `
        <td>
            <span class="task-title">${task.title}</span>
            <input class="edit-input task-edit-title" type="text" value="${task.title.replace(/"/g, '&quot;')}">
        </td>
        <td>
            <span class="task-desc">${task.description}</span>
            <input class="edit-input task-edit-desc" type="text" value="${task.description.replace(/"/g, '&quot;')}">
        </td>
        <td>
            <span class="status-badge task-status" style="background: ${statusColors[task.status]}">${task.status}</span>
            <select class="edit-input task-edit-status">
                <option value="Pendiente" ${task.status === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                <option value="En progreso" ${task.status === 'En progreso' ? 'selected' : ''}>En progreso</option>
                <option value="Completada" ${task.status === 'Completada' ? 'selected' : ''}>Completada</option>
            </select>
        </td>
        <td class="actions-cell">
            <button class="action-btn action-btn--edit btn-edit">Editar</button>
            <button class="action-btn action-btn--delete btn-delete">Eliminar</button>
            <button class="action-btn action-btn--save btn-save" style="display:none">Guardar</button>
            <button class="action-btn action-btn--cancel btn-cancel" style="display:none">Cancelar</button>
        </td>
    `;

    row.querySelector('.btn-edit').addEventListener('click', () => enableEditMode(row, task));
    row.querySelector('.btn-delete').addEventListener('click', () => deleteTask(task.id, row));
    row.querySelector('.btn-save').addEventListener('click', () => saveEdit(task.id, row));
    row.querySelector('.btn-cancel').addEventListener('click', () => cancelEdit(row, task));

    taskTableBody.appendChild(row);
}

function enableEditMode(row, task) {
    row.querySelector('.task-title').style.display = 'none';
    row.querySelector('.task-desc').style.display = 'none';
    row.querySelector('.task-status').style.display = 'none';
    row.querySelector('.task-edit-title').style.display = 'block';
    row.querySelector('.task-edit-desc').style.display = 'block';
    row.querySelector('.task-edit-status').style.display = 'block';
    row.querySelector('.btn-edit').style.display = 'none';
    row.querySelector('.btn-delete').style.display = 'none';
    row.querySelector('.btn-save').style.display = 'inline-block';
    row.querySelector('.btn-cancel').style.display = 'inline-block';
}

function cancelEdit(row, task) {
    row.querySelector('.task-title').style.display = 'inline';
    row.querySelector('.task-desc').style.display = 'inline';
    row.querySelector('.task-status').style.display = 'inline';
    row.querySelector('.task-edit-title').style.display = 'none';
    row.querySelector('.task-edit-desc').style.display = 'none';
    row.querySelector('.task-edit-status').style.display = 'none';
    row.querySelector('.btn-edit').style.display = 'inline-block';
    row.querySelector('.btn-delete').style.display = 'inline-block';
    row.querySelector('.btn-save').style.display = 'none';
    row.querySelector('.btn-cancel').style.display = 'none';
}

function disableAllEditModes() {
    document.querySelectorAll('#taskTableBody tr').forEach(row => {
        const taskId = row.dataset.taskId;
        const task = tasks.find(t => String(t.id) === String(taskId));
        if (task) cancelEdit(row, task);
    });
}

async function saveEdit(taskId, row) {
    const newTitle = row.querySelector('.task-edit-title').value.trim();
    const newDesc = row.querySelector('.task-edit-desc').value.trim();
    const newStatus = row.querySelector('.task-edit-status').value;

    if (!newTitle || !newDesc) {
        showToast('El título y la descripción no pueden estar vacíos', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle, description: newDesc, status: newStatus })
        });

        if (response.ok) {
            const updatedTask = await response.json();
            const idx = tasks.findIndex(t => String(t.id) === String(taskId));
            if (idx !== -1) tasks[idx] = updatedTask;
            cancelEdit(row, updatedTask);
            row.querySelector('.task-title').textContent = updatedTask.title;
            row.querySelector('.task-desc').textContent = updatedTask.description;
            const statusBadge = row.querySelector('.task-status');
            statusBadge.textContent = updatedTask.status;
            statusBadge.style.background = statusColors[updatedTask.status];
            showToast('Tarea actualizada correctamente', 'success');
        } else {
            showToast('Error al actualizar la tarea', 'error');
        }
    } catch (error) {
        showToast('Error de conexión al actualizar la tarea', 'error');
    }
}

async function deleteTask(taskId, row) {
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            tasks = tasks.filter(t => String(t.id) !== String(taskId));
            row.remove();
            updateTaskCount();
            if (tasks.length === 0) showEmptyState();
            showToast('Tarea eliminada correctamente', 'success');
        } else {
            showToast('Error al eliminar la tarea', 'error');
        }
    } catch (error) {
        showToast('Error de conexión al eliminar la tarea', 'error');
    }
}

async function searchUser() {
    const userId = userIdInput.value;

    if (!isValidInput(userId)) {
        showValidationError("Por favor ingresa un documento/ID válido");
        return;
    }

    btnSearch.disabled = true;
    btnSearch.textContent = 'Buscando...';
    userInfo.innerHTML = '';
    taskFormContainer.style.display = 'none';

    try {
        const response = await fetch(`${API_URL}/users`);
        const users = await response.json();

        const user = users.find(u => String(u.id).trim() === userId.trim());

        if (user) {
            currentUser = user;
            showUserInfo(user);
            enableTaskForm();

            const tasksResponse = await fetch(`${API_URL}/tasks?userId=${userId}`);
            const savedTasks = await tasksResponse.json();

            tasks = savedTasks;
            taskTableBody.innerHTML = '';

            if (tasks.length > 0) {
                hideEmptyState();
                tasks.forEach(task => createTaskElement(task));
            } else {
                showEmptyState();
            }

            updateTaskCount();
        } else {
            showUserNotFound();
        }
    } catch (error) {
        showValidationError("Error de conexión: " + error.message + ". Verifica que el servidor esté corriendo.");
    } finally {
        btnSearch.disabled = false;
        btnSearch.textContent = 'Buscar';
    }
}

async function registerTask(event) {
    event.preventDefault();
    disableAllEditModes();
    clearFieldErrors();

    const titleInput = document.getElementById('taskTitle');
    const descriptionInput = document.getElementById('taskDescription');
    const statusInput = document.getElementById('taskStatus');

    const title = titleInput.value.trim();
    const description = descriptionInput.value.trim();
    const status = statusInput.value;

    let hasError = false;

    if (!title) {
        showFieldError('taskTitle', 'titleError', 'El título es obligatorio. Escribe un título para la tarea.');
        hasError = true;
    }

    if (!description) {
        showFieldError('taskDescription', 'descError', 'La descripción es obligatoria. Describe brevemente la tarea.');
        hasError = true;
    }

    if (hasError) return;

    const task = {
        userId: currentUser.id,
        userName: currentUser.name,
        title: title,
        description: description,
        status: status,
        createdAt: getCurrentTimestamp()
    };

    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });

        if (response.ok) {
            const savedTask = await response.json();
            tasks.push(savedTask);
            createTaskElement(savedTask);
            hideEmptyState();
            updateTaskCount();
            taskForm.reset();
            showToast('Tarea registrada exitosamente', 'success');
        } else {
            showToast('Error al guardar la tarea en el servidor', 'error');
        }
    } catch (error) {
        showToast('Error de conexión: no se pudo guardar la tarea', 'error');
    }
}

btnSearch.addEventListener('click', searchUser);

userIdInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        searchUser();
    }
});

taskForm.addEventListener('submit', registerTask);

document.addEventListener('DOMContentLoaded', async function() {
    showEmptyState();

    try {
        const response = await fetch(`${API_URL}/users`);
        if (response.ok) {
            const users = await response.json();
            console.group("IDs DISPONIBLES PARA BUSCAR (Carga Inicial)");
            console.table(users.map(u => ({ ID: u.id, Nombre: u.name, Rol: u.rol })));
            console.groupEnd();
        }
    } catch (error) {
        console.warn("No se pudieron precargar los IDs. ¿El backend está encendido?", error.message);
    }
});
