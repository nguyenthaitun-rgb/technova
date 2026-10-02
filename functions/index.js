const { GoogleGenerativeAI } = require("@google/generative-ai");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { defineSecret } = require("firebase-functions/params");
const { onCall, HttpsError } = require("firebase-functions/v2/https");

initializeApp();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

exports.chatWithGemini = onCall({
    region: "asia-southeast1",
    secrets: [geminiApiKey],
    enforceAppCheck: false
}, async (request) => {
    const message = typeof request.data?.message === "string" ? request.data.message.trim() : "";
    const history = Array.isArray(request.data?.history) ? request.data.history.slice(-10) : [];

    if (!message || message.length > 1000) {
        throw new HttpsError("invalid-argument", "Tin nhắn không hợp lệ.");
    }

    let products = Array.isArray(request.data?.products) ? request.data.products : [];
    if (!products.length) {
        const snapshot = await getFirestore().collection("products").get();
        products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    }

    products = products.map((product) => {
        const numericPrice = Number(product.price ?? product.price_usd ?? product.amount ?? 0) || 0;
        const price = product.price_usd ?? (numericPrice > 10000 ? +(numericPrice / 23000).toFixed(2) : numericPrice);
        return {
            id: product.id ?? "",
            title: product.title ?? product.name ?? "Sản phẩm chưa có tên",
            category: product.category ?? product.type ?? "Khác",
            price,
            rating: product.rating ?? product.stars ?? 0
        };
    });

    const productList = products.map((product) =>
        `${product.title} | ${product.category} | $${product.price} | ★${product.rating}`
    ).join("\n");
    const historyText = history.map((turn) => {
        const role = turn.role === "user" ? "Khách" : "Trợ lý";
        const text = typeof turn.parts?.[0]?.text === "string" ? turn.parts[0].text : "";
        return `${role}: ${text}`;
    }).join("\n");
    const prompt = `Bạn là trợ lý tư vấn bán hàng thân thiện. Danh sách sản phẩm:\n${productList}\nTrả lời bằng tiếng Việt, ngắn gọn, hiển thị giá bằng USD.\n\n${historyText ? `Lịch sử:\n${historyText}\n\n` : ""}Khách: ${message}\nTrợ lý:`;

    try {
        const apiKey = geminiApiKey.value();
        if (!apiKey) {
            throw new HttpsError("failed-precondition", "GEMINI_API_KEY chưa được cấu hình cho Cloud Function.");
        }

        const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        const result = await model.generateContent(prompt);
        return { reply: result.response.text() || "Không có phản hồi." };
    } catch (error) {
        console.error("Gemini request failed", error);
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", "Không thể kết nối trợ lý lúc này.");
    }
});