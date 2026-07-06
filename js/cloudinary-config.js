// ==========================================================
// BU YERGA O'ZINGIZNING FIREBASE SOZLAMALARINGIZNI QO'YING
// Firebase Console > Project Settings > General > Your apps > SDK setup
// ==========================================================
const firebaseConfig = {
  apiKey: "AIzaSyAfJkO8JHQQZm9hlqoDgUVCwc-DEzJCUVk",
  authDomain: "leonor-xr.firebaseapp.com",
  projectId: "leonor-xr",
  storageBucket: "leonor-xr.firebasestorage.app",
  messagingSenderId: "867599890909",
  appId: "1:867599890909:web:7fdab8b049969e485b1e34"
};

// Asosiy ilova (login qilingan sessiyani ushlab turadi)
firebase.initializeApp(firebaseConfig);

// Ikkinchi (yordamchi) ilova — admin yangi foydalanuvchi yaratganda
// o'zining sessiyasidan chiqib ketmasligi uchun ishlatiladi
const secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");

const auth = firebase.auth();
const secondaryAuth = secondaryApp.auth();
const db = firebase.firestore();

// Fiktiv domen — login/parol tizimini soddalashtirish uchun
// foydalanuvchi nomi shu domen bilan elektron pochtaga aylantiriladi
const FAKE_EMAIL_DOMAIN = "@sevgi-sayti.local";

function usernameToEmail(username) {
  return username.trim().toLowerCase().replace(/\s+/g, "") + FAKE_EMAIL_DOMAIN;
}
