// src/Auth.js

const API_BASE_URL = 'https://backendtareas-m6b7.onrender.com/api/usuarios';

// Función para guardar el token y la info del usuario en el navegador
const saveAuthData = (token, idUsuario, correo) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', idUsuario);
    localStorage.setItem('userEmail', correo);
};

// --- RENDERIZADO DEL FORMULARIO ---
export const renderAuthForm = (isLogin = true, callback) => {
    const title = isLogin ? 'Iniciar Sesión' : 'Registrar Cuenta';
    const btnText = isLogin ? 'Entrar' : 'Registrar';
    const otherAction = isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia Sesión';

    const extraFields = isLogin ? '' : `
        <input type="text" class="form-control mb-2" placeholder="ID de Usuario (Ej: KEVIN2)" name="idUsuario" required>
        <input type="text" class="form-control mb-2" placeholder="Nombre" name="NombreUsuario" required>
        <input type="text" class="form-control mb-2" placeholder="Apellido Paterno" name="ApellidoUsuarioPaterno" required>
        <input type="text" class="form-control mb-2" placeholder="Apellido Materno" name="ApellidoUsuarioMaterno" required>
        <input type="text" class="form-control mb-2" placeholder="Teléfono" name="TelefonoUsuario">
    `;

    return `
        <div class="card shadow mx-auto" style="max-width: 400px;">
            <div class="card-header bg-dark text-white text-center">
                <h3>${title}</h3>
            </div>
            <div class="card-body">
                <form id="auth-form">
                    ${extraFields}
                    <input type="email" class="form-control mb-2" placeholder="Correo Electrónico" name="CorreoUsuario" required>
                    <input type="password" class="form-control mb-3" placeholder="Contraseña" name="password" required>
                    
                    <button type="submit" class="btn ${isLogin ? 'btn-success' : 'btn-primary'} w-100 mb-2">
                        ${btnText}
                    </button>
                    <p class="text-center">
                        <a href="#" id="toggle-auth">${otherAction}</a>
                    </p>
                    <div id="auth-feedback" class="mt-2 text-center"></div>
                </form>
            </div>
        </div>
    `;
};

// --- LÓGICA DE FETCH (PROMISES) ---
export const initAuthLogic = (isLogin, renderAppCallback) => {
    const form = document.getElementById('auth-form');
    const feedback = document.getElementById('auth-feedback');
    const endpoint = isLogin ? '/login' : '/registro';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        feedback.innerHTML = `<div class="alert alert-info py-1">Procesando...</div>`;

        const formData = new FormData(form);
        const datos = Object.fromEntries(formData);
        
        // 1. Inicia la Promise de fetch
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
            });
            
            // 2. Espera la Promise de la respuesta JSON
            const resultado = await response.json(); 
            
            if (response.ok) {
                if (isLogin) {
                    // Si es login exitoso (200 OK), guardamos el token y redirigimos
                    saveAuthData(resultado.token, resultado.idUsuario, datos.CorreoUsuario);
                    feedback.innerHTML = `<div class="alert alert-success py-1">¡Éxito! Redirigiendo...</div>`;
                    renderAppCallback(); // Redirige al Dashboard de Tareas
                } else {
                    // Si es registro exitoso (201 Created), pedimos que inicie sesión
                    feedback.innerHTML = `<div class="alert alert-success py-1">${resultado.mensaje}. ¡Inicia sesión!</div>`;
                    // Opcional: Cambiar a la vista de Login
                    document.getElementById('app').innerHTML = renderAuthForm(true, renderAppCallback);
                    initAuthLogic(true, renderAppCallback);
                }
            } else {
                // Errores 409, 401, 404
                feedback.innerHTML = `<div class="alert alert-danger py-1">Error: ${resultado.mensaje || 'Fallo en el servidor.'}</div>`;
            }

        } catch (error) {
            // Error de red (Promise rechazada)
            feedback.innerHTML = `<div class="alert alert-danger py-1">Error de conexión con el servidor.</div>`;
        }
    });

    // Lógica para alternar entre login y registro
    document.getElementById('toggle-auth').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('app').innerHTML = renderAuthForm(!isLogin, renderAppCallback);
        initAuthLogic(!isLogin, renderAppCallback);
    });
};