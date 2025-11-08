// src/main.js (Modificar las líneas que definen el Dashboard)

import './style.css'; 
import { renderAuthForm, initAuthLogic } from './Auth';
import { renderDashboard, initDashboardLogic } from './Dashboard'; // ¡NUEVO!

const appContainer = document.getElementById('app');

const isUserAuthenticated = () => {
    return localStorage.getItem('authToken') !== null;
};

const renderApp = () => {
    appContainer.innerHTML = ''; 

    if (isUserAuthenticated()) {
        // MOSTRAR: Dashboard de Tareas (¡REAL!)
        appContainer.innerHTML = renderDashboard();
        initDashboardLogic(renderApp); // Pasa renderApp como callback para el logout
        
    } else {
        // MOSTRAR: Formulario de Login/Registro
        appContainer.innerHTML = renderAuthForm(true, renderApp);
        initAuthLogic(true, renderApp);
    }
};

// Iniciar la aplicación
renderApp();