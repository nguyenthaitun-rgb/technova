const DETAIL_CART_KEY = "technova_cart";
let currentProduct = null;
function readDetailCart(){try{return JSON.parse(localStorage.getItem(DETAIL_CART_KEY)||"[]")}catch(error){return []}}
function addProductToCart(quantity){const cart=readDetailCart();const item=cart.find(entry=>entry.productId===currentProduct.id);if(item){item.quantity+=quantity}else{cart.push({productId:currentProduct.id,name:currentProduct.name,price:Number(currentProduct.price||0),imageUrl:currentProduct.imageUrl||"",quantity})}localStorage.setItem(DETAIL_CART_KEY,JSON.stringify(cart));document.getElementById("message").textContent=`Đã thêm ${quantity} sản phẩm vào giỏ hàng.`}
function updateRatingDisplay(rating, ratingCount){
	const average = Number(rating) || 0;
	document.getElementById("product-rating").textContent = average.toFixed(1);
	document.getElementById("rating-count").textContent = ratingCount ? `${ratingCount} đánh giá` : "Chưa có đánh giá";
}
function setSelectedRating(rating){
	document.querySelectorAll("#rating-buttons button").forEach((button) => {
		button.classList.toggle("selected", Number(button.dataset.rating) <= rating);
	});
}
function loadUserRating(){
	if(typeof firebase === "undefined" || !firebase.auth().currentUser || !currentProduct) return;
	db.collection("products").doc(currentProduct.id).collection("ratings").doc(firebase.auth().currentUser.uid).get().then((snapshot) => {
		if(snapshot.exists) setSelectedRating(Number(snapshot.data().value));
	}).catch((error) => console.error("Không thể tải đánh giá của người dùng:", error));
}
function saveRating(value){
	const user = typeof firebase !== "undefined" ? firebase.auth().currentUser : null;
	const message = document.getElementById("rating-message");
	if(!user){
		message.textContent = "Vui lòng đăng nhập để đánh giá sản phẩm.";
		return;
	}
	const productRef = db.collection("products").doc(currentProduct.id);
	const ratingRef = productRef.collection("ratings").doc(user.uid);
	message.textContent = "Đang lưu đánh giá...";
	db.runTransaction((transaction) => transaction.get(ratingRef).then((ratingSnapshot) => transaction.get(productRef).then((productSnapshot) => {
		const productData = productSnapshot.data() || {};
		const oldValue = ratingSnapshot.exists ? Number(ratingSnapshot.data().value) : 0;
		const count = Number(productData.ratingCount) || (Number(productData.rating) > 0 ? 1 : 0);
		const total = (Number(productData.rating) || 0) * count;
		const nextCount = ratingSnapshot.exists ? count : count + 1;
		transaction.set(ratingRef, { value, userId: user.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
		transaction.update(productRef, { rating: (total - oldValue + value) / nextCount, ratingCount: nextCount });
		return { nextRating: (total - oldValue + value) / nextCount, nextCount };
	}))).then((result) => {
		updateRatingDisplay(result.nextRating, result.nextCount);
		setSelectedRating(value);
		message.textContent = "Đã lưu đánh giá của bạn.";
	}).catch((error) => {
		console.error("Không thể lưu đánh giá:", error);
		message.textContent = "Không thể lưu đánh giá. Vui lòng thử lại.";
	});
}
function showProduct(product, productId) {
	const normalizedProduct = {
		id: productId,
		name: product.name || product.title || "Sản phẩm công nghệ",
		category: product.category || product.type || "Thiết bị công nghệ",
		description: product.description || product.details || "Sản phẩm công nghệ chính hãng, được kiểm tra kỹ lưỡng trước khi giao đến khách hàng.",
		imageUrl: product.imageUrl || product.image || product.thumbnail || "",
		price: Number(product.price ?? product.amount ?? product.price_usd ?? 0) || 0,
		stock: product.stock ?? product.quantity ?? null,
		rating: Number(product.rating) || 0,
		ratingCount: Number(product.ratingCount) || 0
	};
	currentProduct = normalizedProduct;
	document.title = `TechNova - ${normalizedProduct.name}`;
	document.getElementById("product-name").textContent = normalizedProduct.name;
	document.getElementById("product-category").textContent = normalizedProduct.category;
	document.getElementById("product-price").textContent = `${normalizedProduct.price.toLocaleString("vi-VN")}₫`;
	updateRatingDisplay(normalizedProduct.rating, normalizedProduct.ratingCount);
	document.getElementById("product-description").textContent = normalizedProduct.description;
	document.getElementById("product-stock").textContent = normalizedProduct.stock === 0 ? "Hết hàng" : "Còn hàng";
	const image = document.getElementById("product-image");
	image.src = normalizedProduct.imageUrl;
	image.alt = normalizedProduct.name;
	document.getElementById("loading").hidden = true;
	document.getElementById("product-detail").hidden = false;
}
document.querySelectorAll("#rating-buttons button").forEach((button) => {
	button.addEventListener("click", () => saveRating(Number(button.dataset.rating)));
});
if(typeof firebase !== "undefined") firebase.auth().onAuthStateChanged(loadUserRating);
function showError(){document.getElementById("loading").hidden=true;document.getElementById("error-box").hidden=false}
const productId=new URLSearchParams(window.location.search).get("id");
if(productId&&typeof db!=="undefined"){db.collection("products").doc(productId).get().then(snapshot=>snapshot.exists?showProduct(snapshot.data(),snapshot.id):showError()).catch(error=>{console.error("Không thể tải sản phẩm:",error);showError()})}else{showError()}
document.getElementById("minus-btn").addEventListener("click",()=>{const input=document.getElementById("quantity");input.value=Math.max(1,Number(input.value||1)-1)});
document.getElementById("plus-btn").addEventListener("click",()=>{const input=document.getElementById("quantity");input.value=Math.max(1,Number(input.value||1)+1)});
document.getElementById("add-cart-btn").addEventListener("click",()=>{if(currentProduct)addProductToCart(Math.max(1,Number(document.getElementById("quantity").value)||1))});
document.getElementById("buy-now-btn").addEventListener("click",()=>{if(currentProduct){addProductToCart(Math.max(1,Number(document.getElementById("quantity").value)||1));window.location.href="./checkout.html"}});