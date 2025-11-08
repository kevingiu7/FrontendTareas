// src/Dashboard.js
const API_BASE_URL = 'https://backendtareas-m6w7.onrender.com/api/tareas';

// Función auxiliar para obtener el token guardado
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Aquí se usa el JWT para autorizar la petición
    };
};

// --- FUNCIÓN CRUD: READ (Consultar Tareas) ---
const fetchTareas = async () => {
    try {
        // fetch(GET) con el JWT en los Headers
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.status === 401) {
            // Manejo de error si el token expiró
            localStorage.clear();
            alert("Sesión expirada. Inicia sesión de nuevo.");
            window.location.reload(); 
            return [];
        }

        const tareas = await response.json();
        return tareas;

    } catch (error) {
        console.error("Error al cargar tareas:", error);
        return [];
    }
};

// --- RENDERIZADO DEL DASHBOARD ---
export const renderDashboard = () => {
    const userEmail = localStorage.getItem('userEmail');
    
    return `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Gestor de Tareas Relacional</h2>
            <button id="logout-btn" class="btn btn-danger btn-sm">Cerrar Sesión (${userEmail})</button>
        </div>
        <div class="row">
            <div class="col-md-4">
                <div id="tarea-form-container"></div>
            </div>
            <div class="col-md-8">
                <div id="tarea-list-container"></div>
            </div>
        </div>
    `;
};

// --- LÓGICA DEL DASHBOARD ---
export const initDashboardLogic = async (renderAppCallback) => {
    const listContainer = document.getElementById('tarea-list-container');
    const formContainer = document.getElementById('tarea-form-container');
    
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        renderAppCallback();
    });

    // Función que refresca la lista después de cualquier operación CRUD
    const refreshList = async () => {
        const tareas = await fetchTareas();
        renderTaskList(tareas, refreshList, formContainer);
    };

    // 1. Montar el formulario de creación (CREATE)
    renderTaskForm(formContainer, refreshList);

    // 2. Cargar y montar la lista de tareas (READ)
    refreshList(); 
};

// --- COMPONENTE Secundario: Formulario de Tarea (CREATE/UPDATE) ---
const renderTaskForm = (container, refreshList, tarea = null) => {
    const isEdit = tarea !== null;
    container.innerHTML = `
        <div class="card shadow">
            <div class="card-header bg-primary text-white">
                ${isEdit ? 'Editar Tarea' : 'Crear Nueva Tarea'}
            </div>
            <div class="card-body">
                <form id="task-form">
                    <input type="hidden" name="_id" value="${isEdit ? tarea._id : ''}">
                    <div class="mb-3">
                        <input type="text" class="form-control" name="titulo" placeholder="Título" value="${isEdit ? tarea.titulo : ''}" required>
                    </div>
                    <div class="mb-3">
                        <textarea class="form-control" name="descripcion" placeholder="Descripción">${isEdit ? tarea.descripcion : ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Fecha Límite</label>
                        <input type="date" class="form-control" name="fechaLimite" value="${isEdit && tarea.fechaLimite ? tarea.fechaLimite.substring(0, 10) : ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Estado</label>
                        <select class="form-select" name="estado">
                            <option value="pendiente" ${isEdit && tarea.estado === 'pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="en progreso" ${isEdit && tarea.estado === 'en progreso' ? 'selected' : ''}>En Progreso</option>
                            <option value="completada" ${isEdit && tarea.estado === 'completada' ? 'selected' : ''}>Completada</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn ${isEdit ? 'btn-info' : 'btn-success'} w-100">
                        ${isEdit ? 'Guardar Cambios' : 'Insertar Tarea'}
                    </button>
                    ${isEdit ? '<button type="button" id="cancel-edit" class="btn btn-secondary mt-2 w-100">Cancelar</button>' : ''}
                    <div id="task-feedback" class="mt-2"></div>
                </form>
            </div>
        </div>
    `;
    
    // --- LÓGICA DE SUBMIT (CREATE/UPDATE) ---
    const form = document.getElementById('task-form');
    const feedback = document.getElementById('task-feedback');
    
    if (isEdit) {
        document.getElementById('cancel-edit').addEventListener('click', () => renderTaskForm(container, refreshList));
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.innerHTML = `<div class="alert alert-info py-1">Procesando...</div>`;

        const formData = new FormData(form);
        const datos = Object.fromEntries(formData);
        
        const url = isEdit ? `${API_BASE_URL}/${datos._id}` : API_BASE_URL;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: getAuthHeaders(),
                body: JSON.stringify(datos),
            });
            
            const resultado = await response.json(); 
            
            if (response.ok) {
                feedback.innerHTML = `<div class="alert alert-success py-1">${resultado.mensaje}</div>`;
                form.reset();
                renderTaskForm(formContainer, refreshList); // Vuelve al formulario de creación
                refreshList(); // Refresca la tabla
            } else {
                feedback.innerHTML = `<div class="alert alert-danger py-1">Error: ${resultado.mensaje || 'Fallo en el servidor.'}</div>`;
            }

        } catch (error) {
            feedback.innerHTML = `<div class="alert alert-danger py-1">Error de conexión con el servidor.</div>`;
        }
    });
};

// --- COMPONENTE Secundario: Lista de Tareas (READ/DELETE) ---
const renderTaskList = (tareas, refreshList, formContainer) => {
    const container = document.getElementById('tarea-list-container');
    
    let html = `
        <div class="card shadow">
            <div class="card-header bg-secondary text-white">
                Tareas Pendientes (${tareas.length})
            </div>
            <div class="card-body">
                <ul class="list-group list-group-flush">
    `;
    
    if (tareas.length === 0) {
        html += '<li class="list-group-item text-center text-muted">No tienes tareas asignadas.</li>';
    } else {
        tareas.forEach(tarea => {
            const estadoClass = tarea.estado === 'completada' ? 'bg-success-subtle' : (tarea.estado === 'en progreso' ? 'bg-warning-subtle' : '');
            
            html += `
                <li class="list-group-item d-flex justify-content-between align-items-center ${estadoClass}">
                    <div>
                        <strong>${tarea.titulo}</strong> 
                        <span class="badge bg-secondary">${tarea.estado}</span><br>
                        <small class="text-muted">${tarea.descripcion}</small>
                    </div>
                    <div>
                        <button class="btn btn-sm btn-info me-2 edit-btn" data-id="${tarea._id}">Editar</button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${tarea._id}">Eliminar</button>
                    </div>
                </li>
            `;
        });
    }

    html += `
                </ul>
            </div>
        </div>
    `;
    container.innerHTML = html;
    
    // --- LÓGICA DE BOTONES (DELETE/EDIT) ---
    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            if (confirm('¿Estás seguro de eliminar esta tarea?')) {
                // DELETE logic (fetch Promise)
                const response = await fetch(`${API_BASE_URL}/${id}`, {
                    method: 'DELETE',
                    headers: getAuthHeaders(),
                });
                
                if (response.ok) {
                    refreshList(); // Refresca la lista si la eliminación fue exitosa
                } else {
                    alert('Error al eliminar tarea.');
                }
            }
        });
    });

    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.getAttribute('data-id');
            const tareaToEdit = tareas.find(t => t._id === id);
            renderTaskForm(formContainer, refreshList, tareaToEdit); // Carga la tarea en el formulario
        });
    });
};