/* =============================================
 * STATE — Global variables & storage helpers
 * ============================================= */

// Prevent number input scroll
document.addEventListener('wheel', function(e) {
    if (document.activeElement.type === 'number') document.activeElement.blur();
});

// ── State Variables ──
let currentMode = '';
let selectedCategory = '';
let cart = [];
let editingProductId = null;
let billingType = '';
let lastBillNumber = 0;
let salesHistory = [];
let inventory = [];
let revenueChartInstance = null;
let categoryChartInstance = null;
let currentPeriod = 'daily';
let cartSourceView = 'productListView';

const WEBHOOK_URL = '';

// ── Database Helper ──
window.getDbRef = function(path) {
    // window.dbPrefix is set in auth.js ('admin/' or '')
    return rtdb.ref((window.dbPrefix || '') + path);
};

// ── Firebase Listeners (Realtime Database) ──

window.initDatabaseListeners = function() {
    // Load Bill Number
    window.getDbRef('metadata/counters').on('value', snapshot => {
        if (snapshot.exists()) {
            lastBillNumber = snapshot.val().lastBillNumber || 0;
        }
    });

    // Load Inventory (Real-time)
    window.getDbRef('inventory').on('value', snapshot => {
        const data = snapshot.val();
        inventory = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        
        // Auto-cleanup corrupted or ghost items
        inventory.forEach(p => {
            if (!p.category || (typeof p.category === 'string' && p.category.trim() === '') || !p.name) {
                console.warn("Auto-deleting corrupted ghost item:", p);
                window.getDbRef('inventory/' + p.id).remove();
            }
        });
        
        // Ensure only valid items are used in the app
        inventory = inventory.filter(p => p.category && (typeof p.category !== 'string' || p.category.trim() !== '') && p.name);

        if (location.hash === '#/products') renderAllProducts();
    });

    // Load Sales History (Real-time)
    window.getDbRef('salesHistory').limitToLast(200).on('value', snapshot => {
        const data = snapshot.val();
        salesHistory = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse() : [];
        
        if (location.hash === '#/dashboard') {
            // Safe check to ensure functions are defined
            if (typeof renderDashboard === 'function') renderDashboard();
        }
    });
};

// ── Firebase Save Helpers ──
async function saveInventory(productData, id = null) {
    if (id) {
        return window.getDbRef('inventory/' + id).update(productData);
    } else {
        return window.getDbRef('inventory').push(productData);
    }
}

async function saveSale(saleRecord) {
    // 1. Add to sales history
    await window.getDbRef('salesHistory').push(saleRecord);
    // 2. Update bill counter
    await window.getDbRef('metadata/counters').update({ lastBillNumber: lastBillNumber });
}

// ── Notification System ──
function showLowStockNotification(productName, currentStock) {
    if (!("Notification" in window)) return;
    const title = "⚠️ Low Stock Alert";
    const options = {
        body: `${productName} is running low! Only ${currentStock} left in stock.`,
        requireInteraction: true
    };
    if (Notification.permission === "granted") {
        new Notification(title, options);
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(p => {
            if (p === "granted") new Notification(title, options);
        });
    }
}

// ── Cart Badge Helper ──
function updateCartBadges() {
    const count = cart.length;
    const ids = ['cart-badge', 'cart-badge-main', 'cart-badge-billing'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = count;
    });
}

// ── Export Utility ──
window.downloadTableAsCSV = (tableId, filename) => {
    const table = document.getElementById(tableId);
    if (!table) return;

    let csv = [];
    const rows = table.querySelectorAll("tr");
    
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll("td, th");
        for (let j = 0; j < cols.length; j++) {
            // Escape double quotes and remove newlines for clean CSV export
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " ").replace(/"/g, '""');
            // Remove the currency symbol if it's the only special char to make it Excel-friendly
            data = data.replace('₹', ''); 
            row.push(`"${data}"`);
        }
        csv.push(row.join(","));
    }

    const csvFile = new Blob([csv.join("\n")], {type: "text/csv"});
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};
