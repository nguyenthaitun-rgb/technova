const CART_KEY = "technova_cart";

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (error) {
        console.error("Lỗi đọc giỏ hàng:", error);
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
    const cartCount = document.getElementById("cart-count");
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = totalItems;
    }
}

function renderCart() {
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");
    const cart = getCart();

    if (!cartItems || !cartTotal) return;

    if (!cart.length) {
        cartItems.innerHTML = '<div class="cart-empty">Giỏ hàng trống</div>';
        cartTotal.textContent = "0₫";
        updateCartCount();
        return;
    }

    let subtotal = 0;
    cartItems.innerHTML = cart.map((item) => {
        subtotal += item.price * item.quantity;
        return `
            <div class="cart-item">
                <img src="${item.imageUrl}" alt="${escapeHtml(item.name)}">
                <div class="cart-item-info">
                    <div class="cart-item-name">${escapeHtml(item.name)}</div>
                    <div class="cart-item-meta">${(item.price).toLocaleString("vi-VN")}₫</div>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-qty">
                        <button type="button" data-action="decrease" data-product-id="${item.productId}">-</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-action="increase" data-product-id="${item.productId}">+</button>
                    </div>
                </div>
            </div>
        `;
    }).join("");

    cartTotal.textContent = `${subtotal.toLocaleString("vi-VN")}₫`;
    updateCartCount();
}

function addToCart(productId, productName, price, imageUrl) {
    const cart = getCart();
    const existingItem = cart.find((item) => item.productId === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            productId,
            name: productName,
            price,
            imageUrl,
            quantity: 1
        });
    }

    saveCart(cart);
    renderCart();
}

function updateCartQuantity(productId, change) {
    const cart = getCart();
    const itemIndex = cart.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) return;

    cart[itemIndex].quantity += change;

    if (cart[itemIndex].quantity <= 0) {
        cart.splice(itemIndex, 1);
    }

    saveCart(cart);
    renderCart();
}

function loadProducts() {
    const productGrid = document.querySelector("#product-grid");

    if (!productGrid || !db) {
        return;
    }

    db.collection("products")
        .get()
        .then((querySnapshot) => {
            let htmls = "";
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                const productId = doc.id;
                const safeName = escapeHtml(product.name);
                const safeImage = escapeHtml(product.imageUrl);
                htmls += `
                    <div class="product-card">
                        <a class="product-card-link" href="./product-detail.html?id=${encodeURIComponent(productId)}" aria-label="Xem chi tiết ${safeName}">
                            <img src="${product.imageUrl}" alt="${safeName}">
                            <div class="product-info">
                                <div class="product-name">${safeName}</div>
                                <div class="product-price">${product.price.toLocaleString('vi-VN')}₫</div>
                            </div>
                        </a>
                        <div class="product-info">
                            <button class="add-to-cart-btn" data-product-id="${productId}" data-product-name="${safeName}" data-product-price="${product.price}" data-image-url="${safeImage}">
                                Thêm vào giỏ
                            </button>
                        </div>
                    </div>
                `;
            });
            productGrid.innerHTML = htmls;
        })
        .catch((error) => {
            console.error("Error fetching products: ", error);
        });
}

const userIcon = document.getElementById("user-icon");
const userDropdown = document.getElementById("user-dropdown");
const dropdownUserInfo = document.getElementById("dropdown-user-info");
const cartIcon = document.getElementById("cart-icon");
const cartDropdown = document.getElementById("cart-dropdown");
const checkoutBtn = document.querySelector(".checkout-btn");
const productGrid = document.getElementById("product-grid");

function getUserSession() {
    const raw = localStorage.getItem("userSession");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt && new Date().getTime() > session.expiresAt) {
        localStorage.removeItem("userSession");
        return null;
    }
    return session;
}

if (userIcon) {
    userIcon.addEventListener("click", () => {
        const session = getUserSession();
        if (session) {
            dropdownUserInfo.innerHTML = `<strong>${session.email}</strong>`;
            userDropdown.classList.toggle("show");
        } else {
            window.location.href = "./login.html";
        }
    });
}

if (document.getElementById("btn-logout")) {
    document.getElementById("btn-logout").addEventListener("click", () => {
        firebase.auth().signOut()
            .then(() => {
                localStorage.removeItem("userSession");
                userDropdown.classList.remove("show");
                window.location.href = "./login.html";
            })
            .catch((error) => {
                console.log(error.message);
            });
    });
}

if (cartIcon) {
    cartIcon.addEventListener("click", () => {
        if (cartDropdown) {
            cartDropdown.classList.toggle("show");
        }
    });
}

if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
        if (!getCart().length) {
            alert("Giỏ hàng đang trống.");
            return;
        }
        window.location.href = "./checkout.html";
    });
}

if (productGrid) {
    productGrid.addEventListener("click", (event) => {
        const button = event.target.closest(".add-to-cart-btn");
        if (!button) return;

        const productId = button.dataset.productId;
        const productName = button.dataset.productName;
        const price = Number(button.dataset.productPrice);
        const imageUrl = button.dataset.imageUrl;

        addToCart(productId, productName, price, imageUrl);
    });
}

document.addEventListener("click", (e) => {
    if (!e.target.closest(".user-menu")) {
        if (userDropdown) {
            userDropdown.classList.remove("show");
        }
    }

    if (!e.target.closest(".cart-menu")) {
        if (cartDropdown) {
            cartDropdown.classList.remove("show");
        }
    }

    const targetBtn = e.target.closest("[data-action]");
    if (targetBtn) {
        const { action, productId } = targetBtn.dataset;
        if (action === "increase") updateCartQuantity(productId, 1);
        if (action === "decrease") updateCartQuantity(productId, -1);
    }
});

renderCart();
loadProducts();