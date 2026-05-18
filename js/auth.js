/* =============================================
 * AUTHENTICATION — Daily Login Session & Roles
 * ============================================= */

window.dbPrefix = 'developer/'; // Default to developer
let currentUser = null;

function checkAuth() {
    const sessionStr = localStorage.getItem('cycleShopSession');
    if (!sessionStr) return false;

    try {
        const session = JSON.parse(sessionStr);
        const today = new Date().toLocaleDateString();

        // Expire session if it's a new day
        if (session.date !== today) {
            localStorage.removeItem('cycleShopSession');
            return false;
        }

        // Restore session
        currentUser = session.username;
        // Prefix is admin/ for admin mode, developer/ for developer explore mode
        window.dbPrefix = session.username === 'admin' ? 'admin/' : 'developer/';
        return true;
    } catch (e) {
        localStorage.removeItem('cycleShopSession');
        return false;
    }
}

function handleLogin(e) {
    e.preventDefault();
    const uInput = document.getElementById('login-username').value.trim();
    const pInput = document.getElementById('login-password').value.trim();
    const errorEl = document.getElementById('login-error');

    if (uInput === 'admin' && pInput === '12345s') {
        createSession('admin');
    } else {
        errorEl.innerText = 'Invalid username or password';
        errorEl.classList.remove('hidden');
    }
}

function createSession(username) {
    const today = new Date().toLocaleDateString();
    localStorage.setItem('cycleShopSession', JSON.stringify({
        username: username,
        date: today
    }));
    
    currentUser = username;
    window.dbPrefix = username === 'admin' ? 'admin/' : 'developer/';
    
    // Clear the form fields if elements exist
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.reset();
    
    const errorEl = document.getElementById('login-error');
    if (errorEl) errorEl.classList.add('hidden');
    
    // Initialize DB listeners now that we have the right prefix
    if (typeof initDatabaseListeners === 'function') {
        initDatabaseListeners();
    }
    
    // Go to Landing Page
    navigate('#/');
}

// ── Role Selector Navigation Actions ──
window.selectRole = function(role) {
    if (role === 'developer') {
        // Bypasses all credentials, logs in as developer, and navigates immediately
        createSession('developer');
    } else if (role === 'admin-transition') {
        // Transition animation to show password prompt
        const selectionCard = document.getElementById('role-selection-card');
        const loginCard = document.getElementById('admin-login-card');
        if (selectionCard && loginCard) {
            selectionCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
            
            // Focus on password
            const pInput = document.getElementById('login-password');
            if (pInput) {
                pInput.value = '';
                pInput.focus();
            }
        }
    }
};

window.showRoleSelection = function() {
    // Transition back from password prompt to main selection screen
    const selectionCard = document.getElementById('role-selection-card');
    const loginCard = document.getElementById('admin-login-card');
    if (selectionCard && loginCard) {
        loginCard.classList.add('hidden');
        selectionCard.classList.remove('hidden');
        
        // Reset validation error if any
        const errorEl = document.getElementById('login-error');
        if (errorEl) errorEl.classList.add('hidden');
    }
};

// ── Logout ──
window.logout = function() {
    localStorage.removeItem('cycleShopSession');
    currentUser = null;
    window.dbPrefix = 'developer/';
    navigate('#/login');
    // Force reload to clear all cached state arrays
    window.location.reload();
};
