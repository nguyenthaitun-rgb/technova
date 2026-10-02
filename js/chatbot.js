
let chatProducts = [];
let chatHistory = [];
let chatReady = false;

const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const chatPanel = document.getElementById("chat-panel");
const chatToggle = document.getElementById("chat-toggle");
const chatBadge = document.getElementById("chat-badge");
const headerStatus = document.getElementById("header-status");
const closeBtn = document.getElementById("close-btn");

chatToggle.addEventListener("click", () => {
    chatPanel.classList.toggle("open");
    chatBadge.style.display = "none";
});

closeBtn.addEventListener("click", () => {
    chatPanel.classList.remove("open");
});

async function loadChatProducts() {
    try {
        if (typeof db === "undefined") {
            throw new Error("Firebase Firestore chưa được khởi tạo.");
        }

        const snapshot = await db.collection("products").get();

        chatProducts = snapshot.docs.map((doc) => {
            const product = doc.data();

            const rawPrice =
                product.price ??
                product.price_usd ??
                product.amount ??
                0;

            const numericPrice = Number(rawPrice) || 0;

            const price =
                product.price_usd ??
                (numericPrice > 10000
                    ? +(numericPrice / 23000).toFixed(2)
                    : numericPrice);

            return {
                ...product,
                id: doc.id,
                title: product.title ?? product.name ?? "Sản phẩm chưa có tên",
                category: product.category ?? product.type ?? "Khác",
                price,
                rating: product.rating ?? product.stars ?? 0
            };
        });

        if (
            typeof firebase !== "undefined" &&
            firebase.functions
        ) {
            chatReady = true;
            sendBtn.disabled = false;
            headerStatus.textContent = "Sẵn sàng";
        }

    } catch (error) {
        console.error(
            "Không thể tải sản phẩm cho chatbot:",
            error
        );

        headerStatus.textContent = "Chưa kết nối";
        sendBtn.disabled = true;
    }
}

async function sendChatToGemini(userMessage) {

    if (
        typeof firebase === "undefined" ||
        !firebase.functions
    ) {
        throw new Error(
            "Firebase Functions chưa được tải."
        );
    }

    const functions = firebase
        .app()
        .functions("asia-southeast1");

    const chatWithGemini =
        functions.httpsCallable("chatWithGemini");

    const result = await chatWithGemini({
        message: userMessage,

        history: chatHistory,

        products: chatProducts.map(
            ({
                id,
                title,
                category,
                price,
                rating
            }) => ({
                id,
                title,
                category,
                price,
                rating
            })
        )
    });

    return result.data?.reply ||
        "Không có phản hồi.";
}

async function chat(userMessage) {

    if (!chatReady) {
        appendMessage(
            "bot",
            "Chatbot chưa sẵn sàng. Vui lòng thử lại sau."
        );
        return;
    }

    if (!userMessage.trim()) return;

    appendMessage("user", userMessage);

    inputEl.value = "";
    sendBtn.disabled = true;

    const typingEl =
        appendMessage("typing", "Đang suy nghĩ...");

    try {

        const reply =
            await sendChatToGemini(userMessage);

        chatHistory.push(
            {
                role: "user",
                parts: [
                    {
                        text: userMessage
                    }
                ]
            },
            {
                role: "model",
                parts: [
                    {
                        text: reply
                    }
                ]
            }
        );

        typingEl.remove();

        appendMessage(
            "bot",
            reply,
            true
        );

    } catch (error) {

        console.error(
            "CHATBOT ERROR:",
            error
        );

        typingEl.remove();

        let errorMessage =
            "Chatbot đang gặp lỗi.";

        if (
            error.code ===
            "functions/failed-precondition"
        ) {
            errorMessage =
                "GEMINI_API_KEY chưa được cấu hình trên Firebase.";
        }
        else if (
            error.code ===
            "functions/unauthenticated"
        ) {
            errorMessage =
                "Bạn chưa được xác thực với Firebase.";
        }
        else if (
            error.code ===
            "functions/not-found"
        ) {
            errorMessage =
                "Không tìm thấy Cloud Function chatWithGemini.";
        }
        else if (
            error.code ===
            "functions/internal"
        ) {
            errorMessage =
                "Cloud Function đang gặp lỗi. Hãy kiểm tra Firebase Functions Logs.";
        }
        else if (error.message) {
            errorMessage =
                `Lỗi: ${error.message}`;
        }

        appendMessage(
            "bot",
            errorMessage
        );

    } finally {

        sendBtn.disabled = false;
        inputEl.focus();
    }
}

function appendMessage(
    type,
    text,
    showBadge = false
) {

    const message =
        document.createElement("div");

    message.className =
        `message ${type}`;

    message.textContent = text;

    messagesEl.appendChild(message);

    messagesEl.scrollTop =
        messagesEl.scrollHeight;

    if (
        showBadge &&
        !chatPanel.classList.contains("open")
    ) {
        chatBadge.style.display = "block";
    }

    return message;
}

function askSuggestion(button) {
    inputEl.value =
        button.textContent;

    chat(inputEl.value);
}

sendBtn.addEventListener(
    "click",
    () => chat(inputEl.value)
);

inputEl.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            chat(inputEl.value);
        }
    }
);

appendMessage(
    "bot",
    "Xin chào! Mình có thể giúp bạn tìm sản phẩm phù hợp."
);

loadChatProducts();

