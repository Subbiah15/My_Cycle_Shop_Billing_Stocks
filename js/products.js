/* =============================================
 * PRODUCTS — Rendering, Edit, Delete, Form
 * ============================================= */

// Note: selectedCategory, currentMode, and editingProductId are global
searchQuery = '';

function renderAllProducts() {
    const container = document.getElementById('products-container');
    container.innerHTML = '';

    const cycleCategories = ['28 X 1.5 CYCLE', '26 X 1.5 CYCLE', 'MTB & RACE CYCLE', 'KIDS CYCLE'];
    const isCycleCategory = cycleCategories.includes(selectedCategory.toUpperCase());

    // Filter strictly by selected category
    let filtered = inventory.filter(p => {
        const exactCategory = p.category === selectedCategory;
        const isCommon = p.category && p.category.toUpperCase() === 'COMMON';
        const commonMatch = isCommon && p.commonOn && p.commonOn.includes(selectedCategory.toUpperCase());
        return exactCategory || commonMatch;
    });

    const grid = document.createElement('div');
    grid.className = `products-grid ${currentMode === 'UPDATE' ? 'stocks-grid' : 'billing-grid'}`;
    grid.style.marginTop = '20px';

    if (isCycleCategory) {
        ['Wheel', 'Brake', 'Pedal', 'Others'].forEach(sectionName => {
            const wrapper = document.createElement('div');
            wrapper.className = 'product-section-wrapper';
            const header = document.createElement('h2');
            header.className = 'section-header';
            header.innerText = sectionName;
            wrapper.appendChild(header);

            const sectionItems = filtered.filter(p => p.section === sectionName);
            const sectionGrid = document.createElement('div');
            sectionGrid.className = grid.className;

            if (sectionItems.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'no-components-msg';
                empty.innerText = 'No Components';
                wrapper.appendChild(empty);
            } else {
                sectionItems.forEach(p => sectionGrid.appendChild(createProductCard(p)));
                wrapper.appendChild(sectionGrid);
            }
            container.appendChild(wrapper);
        });
    } else {
        if (filtered.length === 0) {
            container.innerHTML = `<div class="no-components-msg" style="margin-left:20px;">No Products found in ${selectedCategory}</div>`;
        } else {
            filtered.forEach(p => grid.appendChild(createProductCard(p)));
            container.appendChild(grid);
        }
    }
}


function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';

    let footerContent = '';
    if (currentMode === 'BILLING') {
        const price = billingType === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
        footerContent = `
            <div class="price-info">
                <div class="price-tag">₹${parseFloat(price).toFixed(2)}</div>
                <button class="add-to-bill-btn" onclick="addToBill('${product.id}')">ADD</button>
            </div>
            <div class="quantity-controls">
                <button class="qty-btn" onclick="updateQty('${product.id}', -1)">-</button>
                <input type="number" class="qty-input" id="qty-${product.id}" value="1" min="1">
                <button class="qty-btn" onclick="updateQty('${product.id}', 1)">+</button>
            </div>`;
    } else if (currentMode === 'UPDATE') {
        footerContent = `
            <div class="update-footer">
                <div class="price-row-update">
                    <div class="price-tag-sm">R: ₹${parseFloat(product.retailPrice).toFixed(2)}</div>
                    <div class="price-tag-sm wholesale">W: ₹${parseFloat(product.wholesalePrice).toFixed(2)}</div>
                </div>
                <div class="update-controls">
                    <button class="edit-btn" onclick="event.stopPropagation(); editProduct('${product.id}')">EDIT</button>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteProduct('${product.id}')">DELETE</button>
                </div>
            </div>`;
    }

    card.innerHTML = `
        <div class="stock-badge" id="stock-badge-${product.id}">${product.stock} Available ${currentMode === 'UPDATE' ? `(₹${parseFloat(product.actualPrice).toFixed(2)} AP)` : ''}</div>
        <div class="product-image-container">
            ${product.image ? `<img src="${product.image}">` : '<span>No Image</span>'}
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.size}</p>
        </div>
        <div class="product-footer">${footerContent}</div>`;
    return card;
}

// ── Edit Product ──
window.editProduct = (id) => {
    const product = inventory.find(p => p.id === id);
    if (!product) return;

    editingProductId = id;
    selectedCategory = product.category;

    document.getElementById('form-title').innerText = 'Edit Product';
    document.getElementById('btn-save-product').innerText = 'Update & Save';

    document.getElementById('cycle-name').value = product.name || '';
    document.getElementById('cycle-size').value = product.size || '';
    document.getElementById('actual-price').value = product.actualPrice || 0;
    document.getElementById('retail-price').value = product.retailPrice || 0;
    document.getElementById('wholesale-price').value = product.wholesalePrice || 0;
    document.getElementById('stock-count').value = product.stock || 0;
    document.getElementById('low-stock-threshold').value = product.lowStockThreshold || 5;

    const sectionSelect = document.getElementById('product-section');
    for (let i = 0; i < sectionSelect.options.length; i++) {
        if (sectionSelect.options[i].value === product.section) { sectionSelect.selectedIndex = i; break; }
    }

    document.querySelectorAll('input[name="common_on"]').forEach(cb => {
        cb.checked = product.commonOn && product.commonOn.includes(cb.value);
    });

    const preview = document.getElementById('image-preview');
    preview.innerHTML = product.image
        ? `<img src="${product.image}" style="width:100%;height:100%;object-fit:contain;border-radius:8px;">`
        : '<span>No image selected</span>';

    const cycleCategories = ['28 X 1.5 CYCLE', '26 X 1.5 CYCLE', 'MTB & RACE CYCLE', 'KIDS CYCLE'];
    const isCycle = cycleCategories.includes(product.category.toUpperCase());
    const isCommon = product.category.toUpperCase() === 'COMMON';

    document.getElementById('cycle-size-group').style.display = isCycle ? 'flex' : 'none';
    document.getElementById('product-section-group').style.display = (isCycle || isCommon) ? 'flex' : 'none';
    document.getElementById('common-checkboxes-group').style.display = isCommon ? 'flex' : 'none';

    navigate('#/add-product');
};

// ── Delete Product ──
window.deleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
        await window.getDbRef('inventory/' + id).remove();
        alert("Product deleted successfully!");
        navigate('#/');
    }
};

// ── Image Compressor Utility ──
function compressImage(file, maxWidth = 400) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const scale = maxWidth / img.width;
                    canvas.width = maxWidth;
                    canvas.height = img.height * scale;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                } catch (e) { reject(e); }
            };
            img.onerror = () => reject(new Error("Failed to load image for compression"));
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
    });
}

// ── Form Submit ──
document.getElementById('cycle-registration-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn-save-product');
    const originalBtnText = btn.innerText;
    btn.innerText = "⏳ Saving...";
    btn.disabled = true;

    const stockVal = parseInt(document.getElementById('stock-count').value);
    const commonOnCheckboxes = document.querySelectorAll('input[name="common_on"]:checked');
    const imageFile = document.getElementById('cycle-image').files[0];
    
    let imageUrl = '';
    
    // If editing, start with existing image
    if (editingProductId) {
        const p = inventory.find(x => x.id === editingProductId);
        if (p) imageUrl = p.image || '';
    }

    try {
        // 1. Process Image (Compressed Base64 - No Cloud Storage needed!)
        if (imageFile) {
            imageUrl = await compressImage(imageFile);
        }

        const productData = {
            category: selectedCategory,
            section: document.getElementById('product-section').value,
            commonOn: Array.from(commonOnCheckboxes).map(cb => cb.value),
            name: document.getElementById('cycle-name').value,
            size: document.getElementById('cycle-size').value,
            actualPrice: parseFloat(document.getElementById('actual-price').value) || 0,
            retailPrice: parseFloat(document.getElementById('retail-price').value) || 0,
            wholesalePrice: parseFloat(document.getElementById('wholesale-price').value) || 0,
            stock: stockVal,
            lowStockThreshold: parseInt(document.getElementById('low-stock-threshold').value) || 5,
            image: imageUrl,
            updatedAt: Date.now()
        };

        if (editingProductId) {
            await saveInventory(productData, editingProductId);
            alert("Product updated successfully!");
            editingProductId = null;
        } else {
            await saveInventory({ ...productData, createdAt: Date.now() });
            alert("Product added successfully!");
        }

        document.getElementById('cycle-registration-form').reset();
        btn.innerText = 'Add & Save';
        document.getElementById('image-preview').innerHTML = '<span>No image selected</span>';
        
        navigate('#/');

    } catch (error) {
        console.error("Save failed:", error);
        alert("Error saving product: " + (error.message || "Unknown error"));
    } finally {
        btn.disabled = false;
        btn.innerText = originalBtnText;
    }
});

// ── Image Preview ──
document.getElementById('cycle-image').addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('image-preview').innerHTML =
                `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`;
        };
        reader.readAsDataURL(file);
    }
});

// ── Search Logic (Flipkart Style) ──
window.clearSearchQuery = () => {
    searchQuery = '';
    ['global-search', 'local-search'].forEach(id => {
        const input = document.getElementById(id);
        if (input) input.value = '';
    });
    ['btn-clear-global-search', 'btn-clear-local-search'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.add('hidden');
    });
    ['search-dropdown', 'local-search-dropdown'].forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) dropdown.classList.add('hidden');
    });
};

function setupSearch(inputId, btnId, dropdownId) {
    const inputEl = document.getElementById(inputId);
    const clearBtnEl = document.getElementById(btnId);
    const dropdownEl = document.getElementById(dropdownId);

    if (inputEl) {
        inputEl.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            
            if (query) {
                if (clearBtnEl) clearBtnEl.classList.remove('hidden');
                if (dropdownEl) dropdownEl.classList.remove('hidden');
                
                // Filter inventory directly
                const results = inventory.filter(p => {
                    return p.name.toLowerCase().includes(query) || 
                           (p.size && p.size.toLowerCase().includes(query)) ||
                           p.retailPrice.toString().includes(query) || 
                           p.wholesalePrice.toString().includes(query);
                });
                
                // Render dropdown
                if (dropdownEl) {
                    dropdownEl.innerHTML = '';
                    if (results.length === 0) {
                        dropdownEl.innerHTML = '<div style="padding:15px;color:#777;text-align:center;">No matching products found</div>';
                    } else {
                        results.slice(0, 10).forEach(product => { // Show top 10 results
                            const item = document.createElement('div');
                            item.className = 'search-dropdown-item';
                            const price = billingType === 'WHOLESALE' ? product.wholesalePrice : product.retailPrice;
                            
                            item.innerHTML = `
                                <div class="dropdown-item-img">
                                    ${product.image ? `<img src="${product.image}" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">` : ''}
                                </div>
                                <div class="dropdown-item-details">
                                    <div class="dropdown-item-name">${product.name} ${product.size ? `(${product.size})` : ''}</div>
                                    <div class="dropdown-item-meta">${product.category} • <span style="color:${product.stock > 0 ? '#4CAF50' : 'red'}">${product.stock} in stock</span></div>
                                </div>
                                <div class="dropdown-item-price">₹${parseFloat(price).toFixed(2)}</div>
                            `;
                            
                            item.addEventListener('click', () => {
                                window.clearSearchQuery();
                                
                                // 1. Set the correct category
                                selectedCategory = product.category.toUpperCase();
                                
                                // 2. Update the UI Header to match the category and mode
                                document.getElementById('product-list-title').innerText = selectedCategory;
                                const histProd = document.getElementById('btn-history-products');
                                const cartProd = document.getElementById('btn-view-cart');
                                if (currentMode === 'UPDATE') {
                                    if (histProd) histProd.classList.add('hidden'); 
                                    if (cartProd) cartProd.classList.add('hidden');
                                } else {
                                    if (histProd) histProd.classList.remove('hidden'); 
                                    if (cartProd) cartProd.classList.remove('hidden');
                                }
                                
                                // 3. Navigate and Render
                                if (location.hash !== '#/products') {
                                    navigate('#/products');
                                }
                                renderAllProducts();
                                
                                // 4. Scroll to and highlight the specific product
                                setTimeout(() => {
                                    const productBadge = document.getElementById(`stock-badge-${product.id}`);
                                    if (productBadge) {
                                        const card = productBadge.closest('.product-card');
                                        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        
                                        // Flash effect
                                        card.style.transition = 'box-shadow 0.3s, transform 0.3s';
                                        card.style.boxShadow = '0 0 20px 5px rgba(40, 167, 69, 0.8)';
                                        card.style.transform = 'scale(1.02)';
                                        
                                        setTimeout(() => { 
                                            card.style.boxShadow = ''; 
                                            card.style.transform = '';
                                        }, 2000);
                                    }
                                }, 150); // slight delay to allow rendering
                            });
                            
                            dropdownEl.appendChild(item);
                        });
                    }
                }
            } else {
                if (clearBtnEl) clearBtnEl.classList.add('hidden');
                if (dropdownEl) dropdownEl.classList.add('hidden');
            }
        });
    }

    if (clearBtnEl) {
        clearBtnEl.addEventListener('click', window.clearSearchQuery);
    }
}

setupSearch('global-search', 'btn-clear-global-search', 'search-dropdown');
setupSearch('local-search', 'btn-clear-local-search', 'local-search-dropdown');

// Close dropdown if clicked outside
document.addEventListener('click', (e) => {
    const globalInput = document.getElementById('global-search');
    const globalDrop = document.getElementById('search-dropdown');
    const localInput = document.getElementById('local-search');
    const localDrop = document.getElementById('local-search-dropdown');

    if (globalInput && !globalInput.contains(e.target) && globalDrop && !globalDrop.contains(e.target)) {
        globalDrop.classList.add('hidden');
    }
    if (localInput && !localInput.contains(e.target) && localDrop && !localDrop.contains(e.target)) {
        localDrop.classList.add('hidden');
    }
});


