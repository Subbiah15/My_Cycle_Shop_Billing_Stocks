/* =============================================
 * HISTORY — Sales history rendering
 * ============================================= */

function renderHistory() {
    const container = document.getElementById('history-container');
    container.innerHTML = '';

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const recent = salesHistory.filter(s => s.timestamp >= sevenDaysAgo).reverse();

    if (recent.length === 0) {
        container.innerHTML = '<p class="empty-msg">No sales in the last 7 days.</p>';
        return;
    }

    recent.forEach(sale => {
        const card = document.createElement('div');
        card.className = 'history-card';
        card.innerHTML = `
            <div class="history-summary" onclick="this.parentElement.classList.toggle('expanded')">
                <span class="history-bill-no">Bill: ${sale.billNo}</span>
                <span class="history-date-time">${sale.dateTime}</span>
                <div class="history-right">
                    <span class="history-total">₹${sale.total.toFixed(2)}</span>
                    <span class="expand-icon">▼</span>
                </div>
            </div>
            <div class="history-details">
                <p style="font-size:0.85rem;color:#666;margin:0 0 10px 0;">
                    Customer: <strong>${sale.customerName}</strong> | Mode: <strong>${sale.paymentMode}</strong>
                </p>
                <div class="history-items-list">
                    ${sale.items.map(item => {
                        const up = item.unitPrice || item.price || 0;
                        const q = item.qty || 1;
                        const lt = item.totalPrice || (up * q);
                        return `<div class="history-item-row">
                            <span class="history-item-name">${item.name} ${item.size ? `(${item.size})` : ''}</span>
                            <span class="history-item-qty">${q} x ₹${up.toFixed(2)}</span>
                            <span class="history-item-price">₹${lt.toFixed(2)}</span>
                        </div>`;
                    }).join('')}
                </div>
                <div class="summary-row" style="margin-top:10px;border-top:1px dashed #eee;padding-top:5px;">
                    <span>Subtotal: ₹${sale.subtotal.toFixed(2)}</span>
                    <span>Discount: -₹${sale.discount.toFixed(2)}</span>
                </div>
            </div>`;
        container.appendChild(card);
    });
}
