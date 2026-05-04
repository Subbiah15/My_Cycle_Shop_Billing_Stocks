/* =============================================
 * INVOICE — Finalize bill, download, share
 * ============================================= */

document.getElementById('btn-finalize-bill').addEventListener('click', async () => {
    const paymentMode = document.querySelector('input[name="payment_mode"]:checked');
    const salesType = document.querySelector('input[name="sales_type"]:checked');
    const billDate = document.getElementById('bill-date').value;
    const finalPrice = document.getElementById('final-price').value;

    if (!paymentMode || !salesType || !billDate || !finalPrice) {
        alert('Please fill all mandatory fields (Date, Sales Type, Payment Mode, Final Price)');
        return;
    }

    lastBillNumber++;
    localStorage.setItem('lastBillNumber', lastBillNumber);

    const customerName = document.getElementById('customer-name').value || '_________________';
    document.getElementById('inv-bill-no').innerText = lastBillNumber;

    const dateParts = billDate.split('-');
    document.getElementById('inv-date').innerText = dateParts.length === 3
        ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : billDate;

    document.getElementById('inv-customer-name').innerText = customerName;
    document.getElementById('inv-payment-mode').innerText = paymentMode.value;

    const invBody = document.getElementById('inv-items-body');
    invBody.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, i) => {
        const itemTotal = item.sellingPrice * item.qty;
        subtotal += itemTotal;
        const row = document.createElement('tr');
        const name = item.size ? `${item.name} (${item.size})` : item.name;
        row.innerHTML = `<td>${i + 1}</td><td>${name}</td><td>${item.qty}</td><td>${itemTotal}.00</td>`;
        invBody.appendChild(row);
    });

    const discount = subtotal - parseFloat(finalPrice);
    document.getElementById('inv-subtotal').innerText = subtotal.toFixed(2);
    document.getElementById('inv-discount').innerText = discount.toFixed(2);
    document.getElementById('inv-total').innerText = parseFloat(finalPrice).toFixed(2);

    // 4. Save to History (Cloud Backed)
    const saleRecord = {
        billNo: lastBillNumber,
        dateTime: new Date().toLocaleString(),
        timestamp: Date.now(),
        total: parseFloat(finalPrice),
        subtotal: subtotal,
        discount: discount,
        paymentMode: paymentMode.value,
        customerName: customerName,
        items: cart.map(item => ({
            name: item.name,
            size: item.size || '',
            qty: item.qty,
            unitPrice: item.sellingPrice,
            totalPrice: item.sellingPrice * item.qty
        }))
    };

    const btn = document.getElementById('btn-finalize-bill');
    const originalText = btn.innerText;
    btn.innerText = "⏳ Finalizing...";
    btn.disabled = true;

    try {
        // 1. Save to Firebase (Works offline automatically)
        await saveSale(saleRecord);
        alert("Bill Generated Successfully!");

        // 2. Optional: Sync to Google Sheets (Background - won't block if it fails)
        try {
            if (typeof syncToGoogleSheets === 'function') {
                syncToGoogleSheets(saleRecord);
            }
        } catch (syncErr) {
            console.warn("Background sync failed:", syncErr);
        }

        // 3. Clear Cart
        cart = [];
        updateCartBadges();

        // 4. Show Invoice
        navigate('#/invoice');
    } catch (e) {
        console.error("Critical Save Error:", e);
        alert("System Error: Could not save bill. Please try again.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
});



// ── Download ──
document.getElementById('btn-download-bill').addEventListener('click', () => {
    const orig = document.title;
    document.title = `Bill_No_${lastBillNumber}`;
    window.print();
    document.title = orig;
});

// ── Share ──
document.getElementById('btn-share-bill').addEventListener('click', async () => {
    const invoiceEl = document.getElementById('bill-invoice-content');
    const btn = document.getElementById('btn-share-bill');
    const btnText = btn.innerText;
    btn.innerText = "⌛ Sharing...";
    btn.disabled = true;

    try {
        const canvas = await html2canvas(invoiceEl, {
            scale: 1.5, useCORS: true, backgroundColor: "#ffffff", logging: false
        });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `Bill_No_${lastBillNumber}.png`, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ files: [file], title: 'Cycle Shop Invoice', text: `Invoice: ${file.name}` });
                } catch (e) { console.log('Share cancelled'); }
            } else {
                alert('Your browser does not support sharing files. Please use Download.');
            }
            btn.innerText = btnText;
            btn.disabled = false;
        }, 'image/png');
    } catch (err) {
        console.error('Invoice capture failed:', err);
        btn.innerText = btnText;
        btn.disabled = false;
        alert('Could not generate invoice image.');
    }
});

// ── Finish & Back Home ──
document.getElementById('btn-finish-bill').addEventListener('click', () => {
    navigate('#/');
});

