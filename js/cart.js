/* =============================================
 * CART — Add to bill, qty, render, checkout
 * ============================================= */

// ── Qty Controls ──
window.updateQty = (id, change) => {
    const el = document.getElementById(`qty-${id}`);
    let val = parseInt(el.value) + change;
    if (val < 1) val = 1;
    el.value = val;
};

// ── Add to Bill ──
window.addToBill = async (id, overrideQty = null) => {
    const qtyEl = document.getElementById(`qty-${id}`);
    const buyQty = overrideQty || (qtyEl ? parseInt(qtyEl.value) : 1);
    const product = inventory.find(p => p.id === id);
    if (!product) return;

    if (product.stock >= buyQty) {
        const newStock = product.stock - buyQty;
        
        // Update Realtime Database
        await window.getDbRef('inventory/' + id).update({ stock: newStock });

        // Low stock notification
        const threshold = product.lowStockThreshold || 5;
        if ((product.stock + buyQty) > threshold && newStock <= threshold) {
            showLowStockNotification(product.name, newStock);
        }

        // Add to cart
        const existing = cart.find(item => item.id === product.id);
        const price = billingType === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
        if (existing) {
            existing.qty += buyQty;
            existing.sellingPrice = price;
        } else {
            cart.push({ ...product, qty: buyQty, sellingPrice: price });
        }

        updateCartBadges();
        alert(`${product.name} added to cart successfully!`);

        // Visual feedback
        const btn = event.currentTarget;
        const originalText = btn.innerText;
        btn.innerText = "ADDED!";
        btn.style.background = "#4CAF50";
        btn.style.color = "white";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "";
            btn.style.color = "";
            qtyEl.value = "1";
        }, 1000);
    } else {
        const badge = document.getElementById(`stock-badge-${id}`);
        badge.style.color = "red";
        badge.style.transform = "scale(1.2)";
        setTimeout(() => { badge.style.color = ""; badge.style.transform = ""; }, 1000);
    }
};

// ── Render Cart ──
function renderCart() {
    const container = document.getElementById('cart-container');
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-msg">Your cart is empty</div>`;
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.sellingPrice * item.qty;
            total += itemTotal;
            const el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = `
                <div class="cart-item-left">
                    <div class="cart-item-image">
                        ${item.image ? `<img src="${item.image}">` : '<span>No Image</span>'}
                    </div>
                    <div class="cart-item-info">
                        <h3>${item.name}</h3>
                        <p>${item.size}</p>
                        <p class="cart-qty-price">${item.qty} × ₹${item.sellingPrice}</p>
                    </div>
                </div>
                <div class="cart-item-right">
                    <div class="cart-item-price">₹${itemTotal}.00</div>
                    <button class="remove-cart-btn" onclick="removeFromCart(${index})">×</button>
                </div>`;
            container.appendChild(el);
        });
    }
    document.getElementById('cart-total-price').innerText = total.toFixed(2);
}

// ── Remove from Cart ──
window.removeFromCart = async (index) => {
    const item = cart[index];
    const inv = inventory.find(p => p.id === item.id);
    if (inv) { 
        await window.getDbRef('inventory/' + item.id).update({ stock: inv.stock + item.qty });
    }
    cart.splice(index, 1);
    updateCartBadges();
    renderCart();
};

// ── Clear Cart ──
window.clearCart = async () => {
    if (cart.length === 0) return;
    for (const item of cart) {
        const inv = inventory.find(p => p.id === item.id);
        if (inv) {
            await window.getDbRef('inventory/' + item.id).update({ stock: inv.stock + item.qty });
        }
    }
    cart = [];
    updateCartBadges();
    renderCart();
};

document.addEventListener('click', e => {
    if (e.target && e.target.id === 'btn-clear-cart') clearCart();
});
