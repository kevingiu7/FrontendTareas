// src/Auth.js (CÓDIGO REVISADO)

const API_BASE_URL = 'https://backendtareas-m6w7.onrender.com/api/usuarios';

// Función para guardar el token y la info del usuario en el navegador
const saveAuthData = (token, idUsuario, correo) => {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userId', idUsuario);
    localStorage.setItem('userEmail', correo);
};

// --- ESTRUCTURA DE FORMULARIOS DENTRO DEL SLIDER ---

// Formulario de Inicio de Sesión
const getLoginFormHtml = () => `
    <form id="login-form" class="form-container-slider">
        <h1>Iniciar Sesión</h1>
        <span>usa tu correo electrónico y contraseña</span>
        
        <input type="email" placeholder="Correo Electrónico" name="CorreoUsuario" required>
        <input type="password" placeholder="Contraseña" name="password" required>
        
        <a href="#">¿Olvidaste tu contraseña?</a>
        <button type="submit">Entrar</button>
        <div id="login-feedback" class="mt-2 text-center"></div>
    </form>
`;

// Formulario de Registro
const getRegisterFormHtml = () => `
    <form id="register-form" class="form-container-slider">
        <h1>Crear Cuenta</h1>
        <span>usa tu correo electrónico para el registro</span>
        
        <input type="text" placeholder="Nombre Usuario (Ej: KEVIN2)" name="idUsuario" required>
        <input type="text" placeholder="Nombre" name="NombreUsuario" required>
        <input type="text" placeholder="Apellido Paterno" name="ApellidoUsuarioPaterno" required>
        <input type="text" placeholder="Apellido Materno" name="ApellidoUsuarioMaterno" required>
        <input type="text" placeholder="Teléfono" name="TelefonoUsuario">
        <input type="email" placeholder="Correo Electrónico" name="CorreoUsuario" required>
        <input type="password" placeholder="Contraseña" name="password" required>
        
        <button type="submit">Registrar</button>
        <div id="register-feedback" class="mt-2 text-center"></div>
    </form>
`;

// --- RENDERIZADO DEL CONTENEDOR SLIDER COMPLETO ---
// La función ahora renderiza AMBOS formularios y los paneles de control.
export const renderAuthForm = () => {
    return `
        <div id="auth-container">
            <div class="form-container sign-up">
                ${getRegisterFormHtml()}
            </div>
            
            <div class="form-container sign-in">
                ${getLoginFormHtml()}
            </div>
            
            <div class="toggle-container">
                <div class="toggle">
                    <div class="toggle-panel toggle-left">
                        <h1>¡Bienvenido de Nuevo!</h1>
                        <p>Ingresa tus datos personales para acceder a todas las funciones del sitio</p>
                        <button class="hidden" id="login-btn">Iniciar Sesión</button>
                    </div>
                    
                    <div class="toggle-panel toggle-right">
                        <h1>¡Hola, Amigo!</h1>
                        <p>Regístrate con tus datos personales para usar todas las funciones del sitio</p>
                        <button class="hidden" id="register-btn">Registrar Cuenta</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};

// --- LÓGICA DE FETCH (PROMISES) Y ANIMACIÓN ---
// Ahora no requiere 'isLogin' como parámetro.
export const initAuthLogic = (renderAppCallback) => {
    const mainContainer = document.getElementById('auth-container');
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    
    // Botones del slider
    const registerBtn = document.getElementById('register-btn');
    const loginBtn = document.getElementById('login-btn');

    // 1. Lógica de ANIMACIÓN (Slider)
    registerBtn.addEventListener('click', () => {
        // Añade la clase 'active' para deslizar al formulario de Registro
        mainContainer.classList.add('active');
    });

    loginBtn.addEventListener('click', () => {
        // Remueve la clase 'active' para deslizar al formulario de Login
        mainContainer.classList.remove('active');
    });

    // 2. Lógica de SUBMISSION (Fetch)
    
    // Función centralizada para manejar la sumisión de cualquier formulario
    const handleSubmission = async (e, isLogin) => {
        e.preventDefault();
        
        const form = e.target;
        // Asignación de ID de feedback dinámico
        const feedbackId = isLogin ? 'login-feedback' : 'register-feedback';
        const feedback = document.getElementById(feedbackId);
        const endpoint = isLogin ? '/login' : '/registro';

        feedback.innerHTML = `<div class="alert alert-info py-1">Procesando...</div>`;

        const formData = new FormData(form);
        const datos = Object.fromEntries(formData);
        
        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(datos),
            });
            
            const resultado = await response.json(); 
            
            if (response.ok) {
                if (isLogin) {
                    // Login exitoso
                    saveAuthData(resultado.token, resultado.idUsuario, datos.CorreoUsuario);
                    feedback.innerHTML = `<div class="alert alert-success py-1">¡Éxito! Redirigiendo...</div>`;
                    renderAppCallback(); // Redirige al Dashboard
                } else {
                    // Registro exitoso
                    feedback.innerHTML = `<div class="alert alert-success py-1">${resultado.mensaje}. ¡Ahora inicia sesión!</div>`;
                    // Desliza automáticamente al formulario de Login
                    mainContainer.classList.remove('active');
                    form.reset(); // Limpia el formulario de registro
                }
            } else {
                // Errores
                feedback.innerHTML = `<div class="alert alert-danger py-1">Error: ${resultado.mensaje || 'Fallo en el servidor.'}</div>`;
            }

        } catch (error) {
            // Error de red
            feedback.innerHTML = `<div class="alert alert-danger py-1">Error de conexión con el servidor.</div>`;
        }
    };

    // Adjuntar la lógica de submit a ambos formularios
    loginForm.addEventListener('submit', (e) => handleSubmission(e, true));
    registerForm.addEventListener('submit', (e) => handleSubmission(e, false));
};