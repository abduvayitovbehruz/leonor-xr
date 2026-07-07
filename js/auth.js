// ==========================================================
// AUTENTIFIKATSIYA
// ==========================================================

let currentUser = null;      // { uid, username, nickname, isAdmin, specialName }
let currentUserDoc = null;
let presenceInterval = null;
const PRESENCE_HEARTBEAT_MS = 45000; // har 45 soniyada faollik belgisi yuboriladi
const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 daqiqadan ortiq signal kelmasa - oflayn hisoblanadi

const loginScreen = document.getElementById("login-screen");
const appShell = document.getElementById("app-shell");
const loginForm = document.getElementById("login-form");
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginError.textContent = "";
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginError.textContent = "Login va parolni kiriting.";
    return;
  }

  const submitBtn = loginForm.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Kirilmoqda...";

  try {
    const email = usernameToEmail(username);
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged handles the rest
  } catch (err) {
    console.error(err);
    if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
      loginError.textContent = "Login yoki parol noto'g'ri.";
    } else {
      loginError.textContent = "Xatolik yuz berdi. Qaytadan urinib ko'ring.";
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Kirish";
  }
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  if (currentUser) {
    await stopPresenceTracking(currentUser.uid);
  }
  await auth.signOut();
});

auth.onAuthStateChanged(async (user) => {
  if (user) {
    try {
      const doc = await db.collection("users").doc(user.uid).get();
      if (!doc.exists) {
        loginError.textContent = "Profil topilmadi. Admin bilan bog'laning.";
        await auth.signOut();
        return;
      }
      const data = doc.data();
      if (data.disabled) {
        loginError.textContent = "Bu hisob faol emas.";
        await auth.signOut();
        return;
      }
      currentUserDoc = data;
      currentUser = {
        uid: user.uid,
        username: data.username,
        nickname: data.nickname,
        isAdmin: !!data.isAdmin,
        specialName: data.specialName || null
      };
      onLoginSuccess();
    } catch (err) {
      console.error(err);
      loginError.textContent = "Xatolik yuz berdi.";
    }
  } else {
    currentUser = null;
    currentUserDoc = null;
    if (presenceInterval) { clearInterval(presenceInterval); presenceInterval = null; }
    loginScreen.classList.remove("hidden");
    appShell.classList.add("hidden");
    loginForm.reset();
  }
});

function onLoginSuccess() {
  loginScreen.classList.add("hidden");
  appShell.classList.remove("hidden");

  const displayName = currentUser.isAdmin && currentUser.specialName
    ? currentUser.specialName
    : currentUser.nickname;

  document.getElementById("welcome-text").textContent = `Xush kelibsiz, ${displayName}!`;
  document.getElementById("drawer-user-name").textContent = displayName;

  document.querySelectorAll(".admin-only").forEach(el => {
    el.classList.toggle("hidden", !currentUser.isAdmin);
  });

  startPresenceTracking(currentUser.uid);
  initAppAfterLogin();
}

// ---------------- Presence / faollik kuzatuvi ----------------
async function startPresenceTracking(uid) {
  await recordPresence(uid, true);
  if (presenceInterval) clearInterval(presenceInterval);
  presenceInterval = setInterval(() => recordPresence(uid, false), PRESENCE_HEARTBEAT_MS);

  window.addEventListener("beforeunload", () => {
    // Iloji boricha oflayn belgisini yuborishga urinish (kafolatlanmagan, lekin zararsiz)
    db.collection("users").doc(uid).update({ isOnline: false }).catch(() => {});
  });
}

async function stopPresenceTracking(uid) {
  if (presenceInterval) {
    clearInterval(presenceInterval);
    presenceInterval = null;
  }
  if (uid) {
    try {
      await db.collection("users").doc(uid).update({ isOnline: false });
    } catch (err) {
      console.error(err);
    }
  }
}

async function recordPresence(uid, isFreshLogin) {
  try {
    const updateData = {
      lastActiveAt: firebase.firestore.FieldValue.serverTimestamp(),
      isOnline: true
    };
    if (isFreshLogin) {
      updateData.lastLoginAt = firebase.firestore.FieldValue.serverTimestamp();
    }
    await db.collection("users").doc(uid).update(updateData);

    if (isFreshLogin) {
      await db.collection("users").doc(uid).collection("logins").add({
        at: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (err) {
    console.error(err);
  }
}

function displayNameFor(post) {
  if (post.authorIsAdmin && post.authorSpecialName) return post.authorSpecialName;
  return post.authorNickname || "Foydalanuvchi";
}

function initialsFor(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}
