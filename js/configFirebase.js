// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC_8iGjMLQWDBbxGzYNYFEVt2cG8C6HLto",
    authDomain: "do-mixi-df1f5.firebaseapp.com",
    projectId: "do-mixi-df1f5",
    storageBucket: "do-mixi-df1f5.firebasestorage.app",
    messagingSenderId: "8834997426",
    appId: "1:8834997426:web:6182e6c7aab1d49bf63dab",
    measurementId: "G-LR0BCXRXG4"
};
//Khởi tạo Firebase
const app = firebase.initializeApp(firebaseConfig);
console.log("Firebase initialized", app.name);

// Khai báo Firestore
const db = firebase.firestore();