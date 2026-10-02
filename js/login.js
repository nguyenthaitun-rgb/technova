const inpEmail = document.getElementById("inp-email");
const inpPwd = document.getElementById("inp-pwd");
const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = inpEmail.value.trim();
    const password = inpPwd.value;
    
    if (!email || !password) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }

    firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Signed in
            const user = userCredential.user;
            alert("Đăng nhập thành công");
            const userSession = {
                email: user.email,
                username: user.displayName || user.email.split("@")[0],
                uid: user.uid,
                expiresAt: new Date().getTime() + 3600000 // Session expires in 1 hour
            };
            localStorage.setItem("userSession", JSON.stringify(userSession));
            console.log("User logged in: ", user.uid);
            window.location.href = "./index.html";
        })
        .catch((error) => {
            console.log(error.message);
            const messages = {
                "auth/invalid-credential": "Email hoặc mật khẩu không chính xác.",
                "auth/user-not-found": "Tài khoản không tồn tại.",
                "auth/wrong-password": "Mật khẩu không chính xác.",
                "auth/invalid-email": "Email không hợp lệ.",
                "auth/too-many-requests": "Bạn thử quá nhiều lần. Vui lòng thử lại sau."
            };
            alert("Đăng nhập thất bại: " + (messages[error.code] || "Đã xảy ra lỗi, vui lòng thử lại."));
        });
});
