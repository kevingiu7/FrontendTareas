// src/main.js (Modificar las líneas que definen el Dashboard)

import './style.css'; 
import { renderAuthForm, initAuthLogic } from './Auth';
import { renderDashboard, initDashboardLogic } from './Dashboard'; // ¡NUEVO!

const appContainer = document.getElementById('app');

const isUserAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
};

// src/main.js (Modificación del bloque else)

// ...

const renderApp = () => {
    appContainer.innerHTML = ''; 

    if (isUserAuthenticated()) {
        // MOSTRAR: Dashboard de Tareas
        appContainer.innerHTML = renderDashboard();
        initDashboardLogic(renderApp); // Pasa renderApp como callback para el logout
        
    } else {
        // MOSTRAR: Contenedor Slider de Login/Registro
        // Ya no se requiere el parámetro 'true'
        appContainer.innerHTML = renderAuthForm(); 
        initAuthLogic(renderApp);
    }
};



// Iniciar la aplicación
renderApp();