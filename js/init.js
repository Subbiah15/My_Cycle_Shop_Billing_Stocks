/* =============================================
 * INIT — Event listeners, navigation, SW setup
 * ============================================= */

// ── Navigation Event Listeners ──
document.getElementById('btn-stocks').addEventListener('click', e => { e.preventDefault(); navigate('#/stocks'); });
document.getElementById('btn-billing').addEventListener('click', e => { e.preventDefault(); navigate('#/billing'); });
document.getElementById('btn-sales-dashboard').addEventListener('click', e => { e.preventDefault(); navigate('#/dashboard'); });

// Billing mode
document.getElementById('btn-retail').addEventListener('click', e => {
    e.preventDefault(); billingType = 'RETAIL'; goToCategories('BILLING');
});
document.getElementById('btn-wholesale').addEventListener('click', e => {
    e.preventDefault(); billingType = 'WHOLESALE'; goToCategories('BILLING');
});

// Stocks mode
document.getElementById('btn-add-stock').addEventListener('click', e => { e.preventDefault(); goToCategories('ADD'); });
document.getElementById('btn-update-stock').addEventListener('click', e => { e.preventDefault(); goToCategories('UPDATE'); });

function goToCategories(mode) {
    currentMode = mode;
    const title = document.getElementById('category-title');
    const cartBtn = document.getElementById('btn-view-cart-main');
    const histBtn = document.getElementById('btn-history-main');

    if (mode === 'ADD') {
        title.innerText = 'Add New Stocks';
        cartBtn.classList.add('hidden');
        histBtn.classList.add('hidden');
    } else if (mode === 'UPDATE') {
        title.innerText = 'Update Stocks';
        cartBtn.classList.add('hidden');
        histBtn.classList.add('hidden');
    } else {
        title.innerText = `${billingType === 'RETAIL' ? 'Retail' : 'Wholesale'} Billing`;
        cartBtn.classList.remove('hidden');
        histBtn.classList.remove('hidden');
    }
    navigate('#/categories');
}

// ── Category Card Clicks ──
document.querySelectorAll('.category-card').forEach((card, index) => {
    card.addEventListener('click', e => {
        e.preventDefault();
        
        // Reset search safely
        if (typeof window.clearSearchQuery === 'function') {
            window.clearSearchQuery();
        }

        // Get category name correctly
        selectedCategory = card.querySelector('span:last-child').innerText.replace(/\n/g, ' ').toUpperCase();

        if (currentMode === 'ADD') {
            const sizeGroup = document.getElementById('cycle-size-group');
            const sectionGroup = document.getElementById('product-section-group');
            const commonGroup = document.getElementById('common-checkboxes-group');
            const sizeInput = document.getElementById('cycle-size');
            const sectionInput = document.getElementById('product-section');
            document.querySelectorAll('input[name="common_on"]').forEach(cb => cb.checked = false);

            if (index < 4) {
                sizeGroup.style.display = 'flex'; sectionGroup.style.display = 'flex'; commonGroup.style.display = 'none';
                sizeInput.required = true; sectionInput.required = true;
            } else if (index === 4) {
                sizeGroup.style.display = 'none'; sectionGroup.style.display = 'flex'; commonGroup.style.display = 'flex';
                sizeInput.required = false; sectionInput.required = true; sizeInput.value = '';
            } else {
                sizeGroup.style.display = 'none'; sectionGroup.style.display = 'none'; commonGroup.style.display = 'none';
                sizeInput.required = false; sectionInput.required = false; sizeInput.value = ''; sectionInput.value = '';
            }
            document.getElementById('form-title').innerText = 'New Stocks';
            editingProductId = null;
            navigate('#/add-product');
        } else if (currentMode === 'BILLING' || currentMode === 'UPDATE') {
            document.getElementById('product-list-title').innerText = selectedCategory;
            const histProd = document.getElementById('btn-history-products');
            const cartProd = document.getElementById('btn-view-cart');
            if (currentMode === 'UPDATE') {
                histProd.classList.add('hidden'); cartProd.classList.add('hidden');
            } else {
                histProd.classList.remove('hidden'); cartProd.classList.remove('hidden');
            }
            navigate('#/products');
            renderAllProducts();
        }
    });
});

// ── Back Navigation ──
document.getElementById('btn-back-categories').addEventListener('click', () => {
    if (currentMode === 'BILLING') navigate('#/billing');
    else navigate('#/stocks');
});

document.getElementById('btn-cancel-add').addEventListener('click', () => navigate('#/categories'));

document.getElementById('btn-back-products').addEventListener('click', () => navigate('#/categories'));

// ── Cart Navigation ──
document.getElementById('btn-view-cart').addEventListener('click', () => {
    cartSourceView = 'productListView'; navigate('#/cart');
});
document.getElementById('btn-view-cart-main').addEventListener('click', () => {
    cartSourceView = 'categoryPage'; navigate('#/cart');
});
document.getElementById('btn-view-cart-billing').addEventListener('click', () => {
    cartSourceView = 'billingModeView'; navigate('#/cart');
});

// Cart back button override
document.querySelector('#cart-view [data-back]').addEventListener('click', e => {
    e.preventDefault(); e.stopPropagation();
    if (cartSourceView === 'categoryPage') navigate('#/categories');
    else if (cartSourceView === 'billingModeView') navigate('#/billing');
    else { navigate('#/products'); renderAllProducts(); }
});

// ── Checkout ──
document.getElementById('btn-checkout').addEventListener('click', () => {
    if (cart.length === 0) return;
    document.getElementById('bill-no').value = lastBillNumber + 1;
    document.getElementById('bill-date').value = new Date().toISOString().split('T')[0];
    const total = cart.reduce((s, i) => s + (i.sellingPrice * i.qty), 0);
    document.getElementById('final-price').value = total;
    document.querySelectorAll('input[name="sales_type"]').forEach(r => r.checked = false);
    document.querySelectorAll('input[name="payment_mode"]').forEach(r => r.checked = false);
    navigate('#/checkout');
});

// ── History ──
document.getElementById('btn-history-main').addEventListener('click', () => navigate('#/history'));
document.getElementById('btn-history-billing').addEventListener('click', () => navigate('#/history'));
document.getElementById('btn-history-products').addEventListener('click', () => navigate('#/history'));

// ── Low Stocks ──
const btnLowStocks = document.getElementById('btn-low-stocks');
const lowStocksModal = document.getElementById('low-stocks-modal');
const btnCloseLowStocks = document.getElementById('btn-close-low-stocks');

if (btnLowStocks) {
    btnLowStocks.addEventListener('click', () => {
        const body = document.getElementById('low-stocks-body');
        body.innerHTML = '';
        let hasLow = false;
        inventory.forEach(p => {
            const threshold = p.lowStockThreshold || 5;
            if (p.stock <= threshold) {
                hasLow = true;
                const row = document.createElement('tr');
                const name = p.size ? `${p.name} (${p.size})` : p.name;
                row.innerHTML = `<td>${name}</td><td>${p.category}</td><td style="color:red;font-weight:bold;">${p.stock}</td><td>${threshold}</td>`;
                body.appendChild(row);
            }
        });
        if (!hasLow) body.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:20px;color:#4CAF50;">All stocks are healthy!</td></tr>';
        lowStocksModal.classList.remove('hidden');
    });
}

if (btnCloseLowStocks) {
    btnCloseLowStocks.addEventListener('click', () => lowStocksModal.classList.add('hidden'));
}

// ── All Stocks Report ──
document.getElementById('btn-all-stocks-report').addEventListener('click', () => {
    navigate('#/stocks-report');
});

window.renderStocksReport = () => {
    const tbody = document.getElementById('all-stocks-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (inventory.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px;color:#777;">No products found in inventory.</td></tr>';
        return;
    }
    
    // Sort inventory alphabetically by category, then by name
    const sortedInventory = [...inventory].sort((a, b) => {
        if (a.category < b.category) return -1;
        if (a.category > b.category) return 1;
        return a.name.localeCompare(b.name);
    });
    
    // Pre-calculate sold quantities from sales history
    const soldCounts = {};
    if (typeof salesHistory !== 'undefined') {
        salesHistory.forEach(sale => {
            sale.items.forEach(item => {
                const key = `${item.name}_${item.size || ''}`;
                soldCounts[key] = (soldCounts[key] || 0) + parseInt(item.qty || 1);
            });
        });
    }
    
    sortedInventory.forEach(p => {
        const soldQty = soldCounts[`${p.name}_${p.size || ''}`] || 0;
        const row = document.createElement('tr');
        const status = p.stock <= (p.lowStockThreshold || 5) ? '<span style="color:red;font-weight:bold;">Low Stock</span>' : '<span style="color:green;">In Stock</span>';
        
        row.innerHTML = `
            <td style="font-weight:600;">${p.name}</td>
            <td>${p.size || '-'}</td>
            <td>${p.category || 'N/A'}</td>
            <td>${p.section || 'N/A'}</td>
            <td style="color:#666;">₹${p.actualPrice || 0}</td>
            <td>₹${p.retailPrice}</td>
            <td>₹${p.wholesalePrice}</td>
            <td style="font-weight:bold; color:${p.stock > 0 ? '#333' : 'red'};">${p.stock}</td>
            <td style="font-weight:bold; color:#1a237e;">${soldQty}</td>
            <td>${status}</td>
        `;
        tbody.appendChild(row);
    });
};

document.getElementById('btn-download-stocks-report').addEventListener('click', () => {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-IN').replace(/\//g, '-');
    window.downloadTableAsCSV('all-stocks-table', `All_Stocks_Report_${dateStr}.csv`);
});

// ── Dashboard Export ──
document.getElementById('btn-download-sales-report').addEventListener('click', () => {
    const d = new Date();
    const dateStr = d.toLocaleDateString('en-IN').replace(/\//g, '-');
    // e.g., daily -> Daily, monthly -> Monthly
    const periodCap = currentPeriod.charAt(0).toUpperCase() + currentPeriod.slice(1);
    window.downloadTableAsCSV('dashboard-data-table', `${periodCap}_Sales_Report_${dateStr}.csv`);
});

// ── Service Worker (ENABLED for production) ──
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('Service Worker Registered'))
            .catch(err => console.log('Service Worker Registration Failed', err));
    });
}

// ── Request Notification Permission ──
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// ── Initial Route & Auth Check ──
if (window.checkAuth && window.checkAuth()) {
    if (typeof initDatabaseListeners === 'function') initDatabaseListeners();
    navigate(location.hash && location.hash !== '#/login' ? location.hash : '#/');
} else {
    navigate('#/login');
}




