const CART_KEY = "technova_cart";

const checkoutItemsEl = document.getElementById("checkout-items");
const subtotalEl = document.getElementById("subtotal");
const shippingFeeEl = document.getElementById("shipping-fee");
const grandTotalEl = document.getElementById("grand-total");
const placeOrderBtn = document.getElementById("place-order-btn");
const successModal = document.getElementById("success-modal");
const successBtn = document.getElementById("success-btn");

function formatVND(value) {
    return Number(value || 0).toLocaleString("vi-VN") + "₫";
}

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
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

function getShippingFee() {
    const selected = document.querySelector('input[name="shipping"]:checked');
    return selected && selected.value === "fast" ? 15000 : 0;
}

function renderCheckout() {
    const cart = getCart();

    if (!cart.length) {
        checkoutItemsEl.innerHTML = `
            <div class="empty-checkout">
                Giỏ hàng đang trống.<br><br>
                <a href="./index.html">Quay lại mua hàng</a>
            </div>
        `;
        subtotalEl.textContent = "0₫";
        shippingFeeEl.textContent = "0₫";
        grandTotalEl.textContent = "0₫";
        placeOrderBtn.disabled = true;
        placeOrderBtn.style.opacity = ".5";
        return;
    }

    let subtotal = 0;

    checkoutItemsEl.innerHTML = cart.map(item => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        const itemTotal = price * quantity;
        subtotal += itemTotal;

        return `
            <div class="checkout-item">
                <img src="${escapeHtml(item.imageUrl || "")}" alt="${escapeHtml(item.name || "")}">
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${escapeHtml(item.name || "Sản phẩm")}</div>
                    <div class="checkout-item-meta">
                        ${formatVND(price)} × ${quantity}
                    </div>
                </div>
                <div class="checkout-item-price">${formatVND(itemTotal)}</div>
            </div>
        `;
    }).join("");

    const shippingFee = getShippingFee();
    const grandTotal = subtotal + shippingFee;

    subtotalEl.textContent = formatVND(subtotal);
    shippingFeeEl.textContent = shippingFee ? formatVND(shippingFee) : "Miễn phí";
    grandTotalEl.textContent = formatVND(grandTotal);
}

document.querySelectorAll('input[name="shipping"]').forEach(input => {
    input.addEventListener("change", renderCheckout);
});

//Lưu dữ liệu đơn hàng//
placeOrderBtn.addEventListener("click", async () => {
    const name = document.getElementById("customer-name").value.trim();
    const phone = document.getElementById("customer-phone").value.trim();
    const address = document.getElementById("customer-address").value.trim();

    if (!name || !phone || !address) {
        alert("Vui lòng nhập đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng.");
        return;
    }

    const cart = getCart();

    if (!cart.length) {
        alert("Giỏ hàng đang trống.");
        return;
    }

    const shipping = document.querySelector('input[name="shipping"]:checked').value;
    const payment = document.querySelector('input[name="payment"]:checked').value;

    const shippingFee = shipping === "fast" ? 15000 : 0;
    const subtotal = cart.reduce((sum, item) => {
        return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
    }, 0);
    const order = {
        id: "TN" + Date.now(),
        customer: {
            name,
            phone,
            address,
            note: document.getElementById("customer-note").value.trim()
        },
        shipping: shipping === "fast" ? "Giao nhanh" : "Giao tiêu chuẩn",
        shippingFee,
        payment: payment === "cod" ? "COD" : "Chuyển khoản",
        items: cart,
        subtotal,
        total: subtotal + shippingFee,
        status: "Chờ xác nhận",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const currentUser = firebase.auth().currentUser;
    if (currentUser) {
        order.userId = currentUser.uid;
        order.userEmail = currentUser.email || "";
    }

    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Đang lưu đơn hàng...";

    try {
        await db.collection("orders").add(order);
        localStorage.setItem("technova_last_order", JSON.stringify({
            ...order,
            createdAt: new Date().toISOString()
        }));
        localStorage.removeItem(CART_KEY);
        successModal.classList.add("show");
    } catch (error) {
        console.error("Không thể lưu đơn hàng vào Firebase:", error);
        alert("Đặt hàng thất bại. Vui lòng kiểm tra kết nối và thử lại.");
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = "Đặt hàng";
    }
});

successBtn.addEventListener("click", () => {
    window.location.href = "./index.html";
});

renderCheckout();
