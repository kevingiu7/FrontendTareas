// src/Dashboard.js
const API_BASE_URL = 'https://backendtareas-m6w7.onrender.com/api/tareas';

// --- GESTIÓN DE ESTADO Y ELEMENTOS GLOBALES ---
let tasks = []; // Almacena el estado de las tareas localmente
let formContainer; 
let listContainer;

// Función auxiliar para obtener el token guardado
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Función auxiliar para manejar la expiración de la sesión
const handleUnauthorized = () => {
    localStorage.clear();
    alert("Sesión expirada. Inicia sesión de nuevo.");
    window.location.reload(); 
};

// --- FUNCIÓN CRUD: READ (Consultar Tareas Inicial) ---
const fetchTareas = async () => {
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.status === 401) {
            handleUnauthorized();
            return [];
        }

        if (!response.ok) {
            throw new Error('Fallo al obtener tareas');
        }

        return await response.json();

    } catch (error) {
        console.error("Error al cargar tareas:", error);
        return [];
    }
};

// --- FUNCIÓN CRUD: DELETE (Eliminar Tarea) ---
const deleteTarea = async (id) => {
    // Usamos confirm() como solución simple. En un entorno real se usaría un Modal de Bootstrap.
    if (!confirm('¿Estás seguro de eliminar esta tarea?')) {
        return false;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });
        
        if (response.status === 401) {
            handleUnauthorized();
            return false;
        }

        if (response.ok) {
            // MEJORA: Eliminamos localmente y redibujamos, sin hacer GET
            tasks = tasks.filter(t => t._id !== id);
            renderTaskList();
            return true;
        } else {
            const errorData = await response.json();
            alert(`Error al eliminar: ${errorData.mensaje || 'Fallo en el servidor.'}`);
            return false;
        }

    } catch (error) {
        alert('Error de conexión al intentar eliminar la tarea.');
        return false;
    }
};

// Función auxiliar para obtener clases según el estado de la tarea
const getStatusClasses = (estado) => {
    // Clases de color para la tarjeta, el badge y el título
    switch (estado) {
        case 'completada':
            return {
                card: 'border-success',
                badge: 'bg-success',
                title: 'text-decoration-line-through text-muted'
            };
        case 'en progreso':
            return {
                card: 'border-warning',
                badge: 'bg-warning text-dark',
                title: 'text-dark'
            };
        default: // pendiente
            return {
                card: 'border-danger',
                badge: 'bg-danger',
                title: 'text-danger'
            };
    }
}

// --- RENDERIZADO DEL DASHBOARD (HTML ESTRUCTURAL) ---
export const renderDashboard = () => {
    const userEmail = localStorage.getItem('userEmail');
    
    // Se incluye el enlace a Bootstrap Icons para los iconos (Bi)
    return `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="text-primary">Gestor de Tareas <i class="bi bi-list-check"></i></h2>
            <button id="logout-btn" class="btn btn-danger btn-sm">Cerrar Sesión (${userEmail})</button>
        </div>
        <div class="row">
            <div class="col-md-4 mb-4">
                <div id="tarea-form-container"></div>
            </div>
            <div class="col-md-8">
                <div id="tarea-list-container"></div>
            </div>
        </div>
        <div class="toast-container position-fixed bottom-0 end-0 p-3">
            <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto text-primary" id="toast-title">Notificación</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body" id="toast-body">
                    Mensaje de prueba.
                </div>
            </div>
        </div>
    `;
};

// Muestra un Toast de Bootstrap 
const showToast = (title, message, isError = false) => {
    const toastEl = document.getElementById('liveToast');
    const toastBody = document.getElementById('toast-body');
    const toastTitle = document.getElementById('toast-title');
    
    toastTitle.textContent = title;
    toastBody.textContent = message;
    
    // Cambia el color del título del toast
    toastTitle.classList.remove('text-primary', 'text-danger', 'text-success');
    toastTitle.classList.add(isError ? 'text-danger' : 'text-success');

    // Inicializa y muestra el toast
    const toast = new bootstrap.Toast(toastEl, { delay: 4000 });
    toast.show();
};


// --- LÓGICA DEL DASHBOARD (Inicialización) ---
export const initDashboardLogic = async (renderAppCallback) => {
    listContainer = document.getElementById('tarea-list-container');
    formContainer = document.getElementById('tarea-form-container'); 

    // Evento para Cerrar Sesión
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        renderAppCallback();
    });

    // 1. Cargar el estado inicial de las tareas
    tasks = await fetchTareas();
    
    // 2. Montar el formulario de creación (CREATE)
    renderTaskForm();

    // 3. Cargar y montar la lista de tareas (READ)
    renderTaskList(); 
};


// --- COMPONENTE Secundario: Formulario de Tarea (CREATE/UPDATE) ---
const renderTaskForm = (tarea = null) => {
    const isEdit = tarea !== null;
    formContainer.innerHTML = `
        <div class="card shadow">
            <div class="card-header ${isEdit ? 'bg-info' : 'bg-primary'} text-white">
                ${isEdit ? '<i class="bi bi-pencil-square"></i> Editar Tarea' : '<i class="bi bi-plus-circle-fill"></i> Crear Nueva Tarea'}
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
                        <i class="bi bi-hdd-fill"></i> ${isEdit ? 'Guardar Cambios' : 'Insertar Tarea'}
                    </button>
                    ${isEdit ? '<button type="button" id="cancel-edit" class="btn btn-secondary mt-2 w-100">Cancelar Edición</button>' : ''}
                </form>
            </div>
        </div>
    `;
    
    // --- LÓGICA DE SUBMIT (CREATE/UPDATE) ---
    const form = document.getElementById('task-form');
    
    if (isEdit) {
        document.getElementById('cancel-edit').addEventListener('click', () => renderTaskForm());
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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
            
            if (response.status === 401) {
                handleUnauthorized();
                return;
            }

            const resultado = await response.json(); 
            
            if (response.ok) {
                // MEJORA: Actualizar el estado local (tasks)
                if (isEdit) {
                    const index = tasks.findIndex(t => t._id === datos._id);
                    if (index !== -1) {
                        tasks[index] = resultado.tarea; 
                    }
                    showToast('Éxito', 'Tarea actualizada correctamente.', false);
                } else {
                    tasks.unshift(resultado.tarea);
                    showToast('Éxito', 'Tarea creada correctamente.', false);
                }
                
                renderTaskList(); // Redibujar la lista
                form.reset();
                renderTaskForm(); // Volver al formulario de creación

            } else {
                showToast('Error', resultado.mensaje || 'Fallo en el servidor.', true);
            }

        } catch (error) {
            showToast('Error', 'Error de conexión con el servidor.', true);
        }
    });
};

// --- COMPONENTE Secundario: Lista de Tareas (READ/DELETE) ---
const renderTaskList = () => {
    
    
    const pendingCount = tasks.filter(t => t.estado !== 'completada').length;

    let html = `
        <h4 class="mb-3 text-secondary">
            <i class="bi bi-clipboard-check-fill"></i> Tareas Pendientes y en Curso (${pendingCount})
        </h4>
        <div class="row row-cols-1 g-3">
    `;
    
    if (tasks.length === 0) {
        html += '<div class="col-12"><div class="alert alert-info text-center">No tienes tareas asignadas.</div></div>';
    } else {
        tasks.forEach(tarea => {
            const classes = getStatusClasses(tarea.estado);
            const fechaLimite = tarea.fechaLimite ? new Date(tarea.fechaLimite).toLocaleDateString() : 'N/A';

            html += `
                <div class="col-12">
                    <div class="card shadow-sm ${classes.card} h-100">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h5 class="card-title ${classes.title}">
                                        ${tarea.titulo}
                                    </h5>
                                    <p class="card-text text-muted mb-2">
                                        <small>${tarea.descripcion || 'Sin descripción.'}</small>
                                    </p>
                                    <p class="card-text">
                                        <span class="badge ${classes.badge} me-2">${tarea.estado.toUpperCase()}</span>
                                        <small class="text-secondary">
                                            <i class="bi bi-calendar-date"></i> Límite: ${fechaLimite}
                                        </small>
                                    </p>
                                </div>
                                <div class="btn-group ms-3" role="group">
                                    <button class="btn btn-ms btn-info edit-btn" data-id="${tarea._id}" title="Editar Tarea">
                                        <i class="bi bi-pencil-square"></i>
                                    </button>
                                    <button class="btn btn-ms btn-danger delete-btn" data-id="${tarea._id}" title="Eliminar Tarea">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    html += `</div>`;
    listContainer.innerHTML = html;
    
    // --- LÓGICA DE BOTONES (DELETE/EDIT) ---
    listContainer.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            await deleteTarea(id); 
        });
    });

    listContainer.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const tareaToEdit = tasks.find(t => t._id === id);
            renderTaskForm(tareaToEdit); 
        });
    });
};