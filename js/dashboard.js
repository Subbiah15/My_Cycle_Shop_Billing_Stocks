/* =============================================
 * DASHBOARD — KPIs, Charts, Data Table, Sync
 * ============================================= */

// ── Google Sheets Sync ──
async function syncToGoogleSheets(saleRecord) {
    if (!WEBHOOK_URL) return;
    const btn = document.getElementById('btn-sync-status');
    if (!btn) return;
    btn.innerText = "Syncing...";
    btn.style.background = "#f39c12";
    try {
        await fetch(WEBHOOK_URL, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleRecord)
        });
        btn.innerText = "Excel Sync: OK";
        btn.style.background = "#4CAF50";
    } catch (e) {
        btn.innerText = "Sync Failed";
        btn.style.background = "#e74c3c";
    }
}

// ── Tab Clicks ──
document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentPeriod = tab.dataset.period;
        updateKPIs();
        setupRevenueChart();
        setupCategoryChart();
        updateDataTable();
    });
});

function renderDashboard() {
    currentPeriod = 'daily';
    document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
    const dailyTab = document.querySelector('.dash-tab[data-period="daily"]');
    if (dailyTab) dailyTab.classList.add('active');
    updateKPIs();
    setupRevenueChart();
    setupCategoryChart();
    updateDataTable();
}

// ── KPIs ──
function updateKPIs() {
    const now = new Date();
    let rev = 0, profit = 0, bills = 0;
    const labels = { daily: "Today's", weekly: "This Week's", monthly: "This Month's", yearly: "This Year's" };
    const prefix = labels[currentPeriod];
    document.getElementById('kpi-revenue-label').innerText = `${prefix} Revenue`;
    document.getElementById('kpi-profit-label').innerText = `${prefix} Profit`;
    document.getElementById('kpi-bills-label').innerText = `${prefix} Bills`;

    salesHistory.forEach(sale => {
        const sd = new Date(sale.timestamp);
        let inPeriod = false;
        if (currentPeriod === 'daily') inPeriod = sd.toLocaleDateString() === now.toLocaleDateString();
        else if (currentPeriod === 'weekly') { const wa = new Date(); wa.setDate(wa.getDate()-7); inPeriod = sd >= wa && sd <= now; }
        else if (currentPeriod === 'monthly') inPeriod = sd.getMonth() === now.getMonth() && sd.getFullYear() === now.getFullYear();
        else if (currentPeriod === 'yearly') inPeriod = sd.getFullYear() === now.getFullYear();
        if (inPeriod) {
            rev += sale.total; bills++;
            sale.items.forEach(item => {
                const inv = inventory.find(p => p.name === item.name && p.size === item.size);
                if (inv) profit += (parseFloat(item.unitPrice||item.price||0) - parseFloat(inv.actualPrice||0)) * parseInt(item.qty||1);
            });
        }
    });
    document.getElementById('kpi-revenue').innerText = `₹${rev.toFixed(2)}`;
    document.getElementById('kpi-profit').innerText = `₹${profit.toFixed(2)}`;
    document.getElementById('kpi-bills').innerText = bills;
}

// ── Revenue Chart ──
function setupRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    if (revenueChartInstance) revenueChartInstance.destroy();
    let labels = [], data = [], title = '';

    if (currentPeriod === 'daily') {
        title = 'Daily Revenue (Last 7 Days)';
        for (let i=6;i>=0;i--) { const d=new Date(); d.setDate(d.getDate()-i); labels.push(d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})); const ds=d.toLocaleDateString(); let t=0; salesHistory.forEach(s=>{if(new Date(s.timestamp).toLocaleDateString()===ds) t+=s.total;}); data.push(t); }
    } else if (currentPeriod === 'weekly') {
        title = 'Weekly Revenue (Last 4 Weeks)';
        for (let w=3;w>=0;w--) { const we=new Date(); we.setDate(we.getDate()-(w*7)); const ws=new Date(we); ws.setDate(ws.getDate()-6); labels.push(`${ws.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} - ${we.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}`); let t=0; salesHistory.forEach(s=>{const sd=new Date(s.timestamp); if(sd>=ws&&sd<=we) t+=s.total;}); data.push(t); }
    } else if (currentPeriod === 'monthly') {
        title = 'Monthly Revenue (Last 6 Months)';
        for (let m=5;m>=0;m--) { const d=new Date(); d.setMonth(d.getMonth()-m); labels.push(d.toLocaleDateString('en-IN',{month:'short',year:'2-digit'})); const tm=d.getMonth(),ty=d.getFullYear(); let t=0; salesHistory.forEach(s=>{const sd=new Date(s.timestamp); if(sd.getMonth()===tm&&sd.getFullYear()===ty) t+=s.total;}); data.push(t); }
    } else if (currentPeriod === 'yearly') {
        title = 'Yearly Revenue';
        const cy=new Date().getFullYear(); for (let y=2;y>=0;y--) { const ty=cy-y; labels.push(ty.toString()); let t=0; salesHistory.forEach(s=>{if(new Date(s.timestamp).getFullYear()===ty) t+=s.total;}); data.push(t); }
    }

    revenueChartInstance = new Chart(ctx, {
        type: currentPeriod === 'daily' ? 'line' : 'bar',
        data: { labels, datasets: [{ label: title, data, borderColor: '#1a237e', backgroundColor: currentPeriod==='daily'?'rgba(26,35,126,0.1)':'rgba(26,35,126,0.7)', fill: currentPeriod==='daily', tension: 0.4, borderRadius: currentPeriod!=='daily'?6:0 }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{beginAtZero:true, ticks:{callback:v=>'₹'+v.toLocaleString('en-IN')}}} }
    });
}

// ── Category Chart ──
function setupCategoryChart() {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();
    
    const now = new Date();
    const catSales = {};
    
    salesHistory.forEach(sale => {
        const sd = new Date(sale.timestamp);
        let inPeriod = false;
        
        if (currentPeriod === 'daily') inPeriod = sd.toLocaleDateString() === now.toLocaleDateString();
        else if (currentPeriod === 'weekly') { const wa = new Date(); wa.setDate(wa.getDate()-7); inPeriod = sd >= wa && sd <= now; }
        else if (currentPeriod === 'monthly') inPeriod = sd.getMonth() === now.getMonth() && sd.getFullYear() === now.getFullYear();
        else if (currentPeriod === 'yearly') inPeriod = sd.getFullYear() === now.getFullYear();
        
        if (inPeriod) {
            sale.items.forEach(item => {
                const inv = inventory.find(p => p.name === item.name && p.size === item.size);
                const cat = inv ? inv.category : 'Unknown';
                if (!catSales[cat]) catSales[cat] = 0;
                catSales[cat] += (item.totalPrice !== undefined && item.totalPrice !== null)
                    ? parseFloat(item.totalPrice)
                    : parseFloat(item.unitPrice||item.price||0) * parseInt(item.qty||1);
            });
        }
    });
    
    const catLabels = Object.keys(catSales), catData = Object.values(catSales);
    if (catLabels.length === 0) { catLabels.push('No Data'); catData.push(1); }
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: catLabels, datasets: [{ data: catData, backgroundColor: ['#1a237e','#4CAF50','#ff9800','#e74c3c','#9b59b6','#34495e','#1abc9c','#e67e22'] }] },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{position:'bottom',labels:{font:{size:11}}}} }
    });
}

// ── Data Table ──
function updateDataTable() {
    const thead = document.getElementById('data-table-head');
    const tbody = document.getElementById('data-table-body');
    const title = document.getElementById('table-title');
    const now = new Date();
    let headHTML = '', bodyHTML = '';

    if (currentPeriod === 'daily') {
        title.innerText = 'Daily Sales Report (Last 30 Days)';
        headHTML = `<tr><th>Bill No</th><th>Date & Time</th><th>Customer</th><th>Payment</th><th style="text-align:right;">Total (₹)</th></tr>`;
        const ago = new Date(); ago.setDate(ago.getDate()-30);
        const recent = salesHistory.filter(s => new Date(s.timestamp) >= ago).reverse();
        if (recent.length === 0) { bodyHTML = `<tr><td colspan="5" style="text-align:center;color:#999;padding:20px;">No sales data.</td></tr>`; }
        else { recent.forEach(s => { bodyHTML += `<tr><td>#${s.billNo}</td><td>${s.dateTime}</td><td>${s.customerName||'Walk-in'}</td><td>${s.paymentMode}</td><td style="text-align:right;color:var(--primary);font-weight:700;">₹${s.total.toFixed(2)}</td></tr>`; }); }
    } else {
        const periods = { weekly: { title: 'Weekly Sales Summary (Last 4 Weeks)', count: 4 }, monthly: { title: 'Monthly Sales Summary (Last 12 Months)', count: 12 }, yearly: { title: 'Yearly Sales Summary (Last 5 Years)', count: 5 } };
        const cfg = periods[currentPeriod];
        title.innerText = cfg.title;
        const firstCol = currentPeriod === 'weekly' ? 'Week' : currentPeriod === 'monthly' ? 'Month' : 'Year';
        headHTML = `<tr><th>${firstCol}</th><th>Total Bills</th><th style="text-align:right;">Profit (₹)</th><th style="text-align:right;">Revenue (₹)</th></tr>`;

        for (let i = 0; i < cfg.count; i++) {
            let label = '', bills = 0, revenue = 0, profit = 0;
            salesHistory.forEach(sale => {
                const sd = new Date(sale.timestamp);
                let match = false;
                if (currentPeriod === 'weekly') {
                    const we = new Date(); we.setDate(we.getDate()-(i*7)); const ws = new Date(we); ws.setDate(ws.getDate()-6);
                    match = sd >= ws && sd <= we;
                    if (i === 0) label = `${ws.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} - ${we.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}`;
                } else if (currentPeriod === 'monthly') {
                    const d = new Date(); d.setMonth(d.getMonth()-i);
                    match = sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
                    if (i === 0) label = d.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
                } else {
                    const ty = now.getFullYear()-i;
                    match = sd.getFullYear() === ty;
                    if (i === 0) label = ty.toString();
                }
                if (match) {
                    bills++; revenue += sale.total;
                    sale.items.forEach(item => {
                        const inv = inventory.find(p => p.name === item.name && p.size === item.size);
                        if (inv) profit += ((item.unitPrice||item.price||0) - (inv.actualPrice||0)) * (item.qty||1);
                    });
                }
            });
            // Recompute label for each iteration
            if (currentPeriod === 'weekly') {
                const we = new Date(); we.setDate(we.getDate()-(i*7)); const ws = new Date(we); ws.setDate(ws.getDate()-6);
                label = `${ws.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})} - ${we.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})}`;
            } else if (currentPeriod === 'monthly') {
                const d = new Date(); d.setMonth(d.getMonth()-i);
                label = d.toLocaleDateString('en-IN',{month:'long',year:'numeric'});
            } else {
                label = (now.getFullYear()-i).toString();
            }
            bodyHTML += `<tr><td>${label}</td><td>${bills}</td><td style="text-align:right;color:#4CAF50;font-weight:700;">₹${profit.toFixed(2)}</td><td style="text-align:right;color:var(--primary);font-weight:700;">₹${revenue.toFixed(2)}</td></tr>`;
        }
    }
    thead.innerHTML = headHTML;
    tbody.innerHTML = bodyHTML;
}
