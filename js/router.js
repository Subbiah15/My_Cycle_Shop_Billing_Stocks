/* =============================================
 * ROUTER — Hash-based SPA navigation
 * ============================================= */

const allViews = () => document.querySelectorAll('[data-view]');

function navigate(hash) {
    if (hash !== '#/login' && (!window.checkAuth || !window.checkAuth())) {
        navigate('#/login');
        return;
    }

    allViews().forEach(v => v.classList.add('hidden'));

    const routeMap = {
        '#/login':     'login-view',
        '#/':          'landing-page',
        '#/dashboard': 'dashboard-view',
        '#/billing':   'billing-mode-view',
        '#/stocks':    'stocks-page',
        '#/stocks-report': 'stocks-report-view',
        '#/categories':'category-page',
        '#/add-product':'add-cycle-form-view',
        '#/products':  'product-list-view',
        '#/cart':      'cart-view',
        '#/checkout':  'checkout-info-view',
        '#/invoice':   'invoice-view',
        '#/history':   'history-view'
    };

    const viewId = routeMap[hash];
    if (!viewId) { navigate('#/'); return; }

    const el = document.getElementById(viewId);
    if (el) el.classList.remove('hidden');

    // Route-specific callbacks
    if (hash === '#/dashboard') renderDashboard();
    if (hash === '#/cart') renderCart();
    if (hash === '#/history') renderHistory();
    if (hash === '#/stocks-report') renderStocksReport();

    document.title = 'Chindhamani — ' + (hash === '#/' ? 'Home' : hash.replace('#/', '').replace(/-/g, ' '));

    if (location.hash !== hash) {
        history.pushState(null, '', hash);
    }
}

// Listen for hash changes (browser back/forward)
window.addEventListener('hashchange', () => navigate(location.hash || '#/'));

// Handle data-back buttons (delegated)
document.addEventListener('click', e => {
    const backBtn = e.target.closest('[data-back]');
    if (backBtn) {
        e.preventDefault();
        navigate(backBtn.dataset.back);
    }
});
