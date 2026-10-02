const inpUsername = document.getElementById("inp-username");
const inpEmail = document.getElementById("inp-email");
const inpPwd = document.getElementById("inp-pwd");
const inpConfirmPwd = document.getElementById("inp-confirm-pwd");
const registerForm = document.getElementById("register-form");

registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = inpUsername.value.trim();
    const email = inpEmail.value.trim();
    const password = inpPwd.value;
    const confirmPassword = inpConfirmPwd.value;

    if( !username || !email || !password || !confirmPassword) {
        alert("Vui lòng điền đầy đủ thông tin!");
        return;
    }
    if(password !== confirmPassword) {
        alert("Mật khẩu xác nhận không khớp!");
        return;
    }
    if (password.length < 6) {
        alert("Mật khẩu phải có ít nhất 6 ký tự!");
        return;
    }
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            return user.updateProfile({ displayName: username }).then(() => {
                alert("Đăng ký thành công. Vui lòng đăng nhập.");
                console.log("User registered: ", user.uid);
                window.location.href = "./login.html";
            });
        })
        .catch((error) => {
            console.log(error.message);
            const messages = {
                "auth/email-already-in-use": "Email này đã được đăng ký.",
                "auth/invalid-email": "Email không hợp lệ.",
                "auth/weak-password": "Mật khẩu quá yếu.",
                "auth/operation-not-allowed": "Đăng ký bằng email chưa được bật trên Firebase."
            };
            alert("Đăng ký thất bại: " + (messages[error.code] || "Đã xảy ra lỗi, vui lòng thử lại."));
        });
});