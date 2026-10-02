function loadProducts() {
    const tableBody = document.getElementById("product-table-body");
    db.collection("products")
        .get()
        .then((querySnapshot) => {
            let htmls = "";
            let stt = 1;
            querySnapshot.forEach((doc) => {
                const product = doc.data();
                const productId = doc.id;
                htmls += `      
                    <tr>
                        <td>${stt++}</td>
                        <td><img src="${product.imageUrl}" alt="${product.name}" width="100"></td>
                        <td>${product.name}</td>
                        <td>${product.price.toLocaleString('vi-VN')}₫</td>
                        <td>
                            <button class="btn-edit" onclick="editProduct('${productId}')">Sửa</button>
                            <button class="btn-delete" onclick="deleteProduct('${productId}')">Xóa</button>
                        </td>
                    </tr>
                `;
            });
            tableBody.innerHTML = htmls;
        })
        .catch((error) => {
            console.error("Error getting products: ", error);
        });
}

document.querySelectorAll(".sidebar-nav .nav-item").forEach((navItem) => {
    navItem.addEventListener("click", (event) => {
        event.preventDefault();
        const sectionName = navItem.dataset.section;
        document.querySelectorAll(".sidebar-nav .nav-item").forEach((item) => {
            item.classList.toggle("active", item === navItem);
        });
        document.querySelectorAll(".content-section").forEach((section) => {
            section.classList.toggle("active", section.dataset.section === sectionName);
        });
        const pageTitle = document.getElementById("page-title");
        pageTitle.textContent = navItem.textContent.replace(/^[^\p{L}\p{N}]*/u, "").trim();
    });
});

loadProducts();

const inpName = document.getElementById("inp-name");
const inpPrice = document.getElementById("inp-price");
const inpImage = document.getElementById("inp-image");
const addForm = document.getElementById("add-product-form");
addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = inpName.value.trim();
    const price = parseFloat(inpPrice.value);
    const imageUrl = inpImage.value.trim();

    if (!name || isNaN(price) || !imageUrl) {
        alert("Vui lòng điền đầy đủ thông tin sản phẩm.");
        return;
    }
    if(price < 0) {
        alert("Giá sản phẩm không được âm.");
        return;
    }
    db.collection("products")
        .add({
            name: name,
            price: price,
            imageUrl: imageUrl
        })
        .then(() => {
            alert("Thêm sản phẩm thành công!");
            addForm.reset();
            loadProducts();
        })
        .catch((error) => {
            console.error("Error adding product: ", error);
        });
});

function deleteProduct(productId) {
    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
        db.collection("products")
            .doc(productId)
            .delete()
            .then(() => {
                alert("Xóa sản phẩm thành công!");
                loadProducts();
            })
            .catch((error) => {
                console.error("Error deleting product: ", error);
            });
    }
}