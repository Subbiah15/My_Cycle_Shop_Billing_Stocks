/* =============================================
 * AUTHENTICATION — Daily Login Session & Roles
 * ============================================= */

window.dbPrefix = '';
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
        window.dbPrefix = session.username === 'admin' ? 'admin/' : '';
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

    if (uInput === 'developer' && pInput === 'Dev123') {
        createSession('developer');
    } else if (uInput === 'admin' && pInput === '12345s') {
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
    window.dbPrefix = username === 'admin' ? 'admin/' : '';
    
    // Clear the form
    document.getElementById('login-form').reset();
    document.getElementById('login-error').classList.add('hidden');
    
    // Initialize DB listeners now that we have the right prefix
    if (typeof initDatabaseListeners === 'function') {
        initDatabaseListeners();
    }
    
    // Go to Landing Page
    navigate('#/');
}

// ── Logout ──
window.logout = function() {
    localStorage.removeItem('cycleShopSession');
    currentUser = null;
    window.dbPrefix = '';
    navigate('#/login');
    // Force reload to clear all cached state arrays
    window.location.reload();
};
