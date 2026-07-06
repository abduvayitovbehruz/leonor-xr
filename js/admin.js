// ==========================================================
// ADMIN PANEL
// ==========================================================

const adminModal = document.getElementById("admin-modal");
const adminBtn = document.getElementById("admin-btn");
const adminCloseBtn = document.getElementById("admin-close-btn");

adminBtn.addEventListener("click", () => {
  adminModal.classList.remove("hidden");
  showAdminTab("users");
});
adminCloseBtn.addEventListener("click", () => adminModal.classList.add("hidden"));

document.querySelectorAll(".admin-tab-btn").forEach(btn => {
  btn.addEventListener("click", () => showAdminTab(btn.dataset.tab));
});

function showAdminTab(tab) {
  document.querySelectorAll(".admin-tab-btn").forEach(b => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".admin-tab-panel").forEach(p => p.classList.add("hidden"));
  document.getElementById(`admin-tab-${tab}`).classList.remove("hidden");

  if (tab === "users") loadUsersList();
  if (tab === "activity") loadActivityList();
  if (tab === "pending") loadPendingDeletions();
  if (tab === "profile") loadAdminProfile();
}

// ---------------- Users tab ----------------
function loadUsersList() {
  const wrap = document.getElementById("admin-users-list");
  wrap.innerHTML = `<div class="empty-state">Yuklanmoqda...</div>`;
  db.collection("users").where("isAdmin", "==", false).get().then(snapshot => {
    if (snapshot.empty) {
      wrap.innerHTML = `<div class="empty-state">Hali foydalanuvchi qo'shilmagan.</div>`;
      return;
    }
    wrap.innerHTML = "";
    snapshot.forEach(doc => {
      const u = doc.data();
      const row = document.createElement("div");
      row.className = "admin-user-row";
      row.innerHTML = `
        <div class="row-top">
          <div>
            <div class="u-name">${escapeHtml(u.nickname)} ${u.disabled ? "(faol emas)" : ""}</div>
            <div class="u-username">login: ${escapeHtml(u.username)}</div>
          </div>
        </div>
        <div class="row-actions">
          <button class="btn btn-sm edit-nickname-btn">Taxallus</button>
          <button class="btn btn-sm edit-password-btn">Parol</button>
          <button class="btn btn-sm btn-danger toggle-disable-btn">${u.disabled ? "Yoqish" : "O'chirish"}</button>
        </div>
      `;
      row.querySelector(".edit-nickname-btn").addEventListener("click", () => editUserNickname(doc.id, u.nickname));
      row.querySelector(".edit-password-btn").addEventListener("click", () => editUserPassword(doc.id, u.username));
      row.querySelector(".toggle-disable-btn").addEventListener("click", () => toggleUserDisabled(doc.id, !u.disabled));
      wrap.appendChild(row);
    });
  });
}

document.getElementById("add-user-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nickname = document.getElementById("new-user-nickname").value.trim();
  const username = document.getElementById("new-user-username").value.trim();
  const password = document.getElementById("new-user-password").value;

  if (!nickname || !username || !password) {
    showToast("Barcha maydonlarni to'ldiring.");
    return;
  }
  if (password.length < 6) {
    showToast("Parol kamida 6 belgidan iborat bo'lishi kerak.");
    return;
  }

  try {
    const email = usernameToEmail(username);
    const cred = await secondaryAuth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;

    await db.collection("users").doc(uid).set({
      nickname,
      username,
      isAdmin: false,
      disabled: false,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    await secondaryAuth.signOut();

    document.getElementById("add-user-form").reset();
    showToast("Foydalanuvchi qo'shildi.");
    loadUsersList();
  } catch (err) {
    console.error(err);
    if (err.code === "auth/email-already-in-use") {
      showToast("Bu login band. Boshqasini tanlang.");
    } else {
      showToast("Xatolik yuz berdi.");
    }
  }
});

function editUserNickname(uid, current) {
  const newNickname = prompt("Yangi taxallus:", current);
  if (newNickname === null || !newNickname.trim()) return;
  db.collection("users").doc(uid).update({ nickname: newNickname.trim() })
    .then(() => { showToast("Yangilandi."); loadUsersList(); })
    .catch(err => { console.error(err); showToast("Xatolik yuz berdi."); });
}

function editUserPassword(uid, username) {
  showToast("Parolni o'zgartirish uchun Firebase konsolidagi Authentication bo'limidan foydalaning (foydalanuvchi: " + username + ").");
}

function toggleUserDisabled(uid, disabled) {
  db.collection("users").doc(uid).update({ disabled })
    .then(() => { showToast(disabled ? "Foydalanuvchi o'chirildi." : "Foydalanuvchi yoqildi."); loadUsersList(); })
    .catch(err => { console.error(err); showToast("Xatolik yuz berdi."); });
}

// ---------------- Activity tab (onlaynlik va kirish tarixi) ----------------
function loadActivityList() {
  const wrap = document.getElementById("admin-activity-list");
  wrap.innerHTML = `<div class="empty-state">Yuklanmoqda...</div>`;

  db.collection("users").where("isAdmin", "==", false).get().then(async (snapshot) => {
    if (snapshot.empty) {
      wrap.innerHTML = `<div class="empty-state">Hali foydalanuvchi qo'shilmagan.</div>`;
      return;
    }

    wrap.innerHTML = "";
    for (const doc of snapshot.docs) {
      const u = doc.data();
      const uid = doc.id;

      const now = Date.now();
      const lastActiveMs = u.lastActiveAt ? u.lastActiveAt.toMillis() : null;
      const isOnline = !!u.isOnline && lastActiveMs && (now - lastActiveMs) < ONLINE_THRESHOLD_MS;

      let statusText;
      if (isOnline) {
        statusText = "Onlayn";
      } else if (lastActiveMs) {
        statusText = `Oxirgi faollik: ${formatDate(new Date(lastActiveMs))}`;
      } else {
        statusText = "Hali kirmagan";
      }

      const row = document.createElement("div");
      row.className = "admin-user-row";
      row.innerHTML = `
        <div class="row-top">
          <div>
            <div class="u-name">${escapeHtml(u.nickname)}</div>
            <div class="activity-status-row">
              <span class="presence-dot ${isOnline ? "online" : "offline"}"></span>
              <span>${statusText}</span>
            </div>
          </div>
        </div>
        <div class="login-history" id="login-history-${uid}">
          <div style="font-size:11px;color:var(--text-muted);">Yuklanmoqda...</div>
        </div>
      `;
      wrap.appendChild(row);

      db.collection("users").doc(uid).collection("logins")
        .orderBy("at", "desc")
        .limit(10)
        .get()
        .then(loginsSnap => {
          const histEl = document.getElementById(`login-history-${uid}`);
          if (!histEl) return;
          if (loginsSnap.empty) {
            histEl.innerHTML = `<div style="font-size:11px;color:var(--text-muted);">Kirish tarixi yo'q.</div>`;
            return;
          }
          histEl.innerHTML = "";
          loginsSnap.forEach(loginDoc => {
            const data = loginDoc.data();
            if (!data.at) return;
            const item = document.createElement("div");
            item.className = "login-history-item";
            item.textContent = formatFullDateTime(data.at.toDate());
            histEl.appendChild(item);
          });
        })
        .catch(err => console.error(err));
    }
  }).catch(err => {
    console.error(err);
    wrap.innerHTML = `<div class="empty-state">Ma'lumotlarni yuklab bo'lmadi.</div>`;
  });
}

function formatFullDateTime(date) {
  const datePart = date.toLocaleDateString("uz-UZ", { day: "numeric", month: "long" });
  const timePart = date.toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });
  return `${datePart}, ${timePart}`;
}


function loadPendingDeletions() {
  const wrap = document.getElementById("admin-pending-list");
  wrap.innerHTML = `<div class="empty-state">Yuklanmoqda...</div>`;
  db.collection("posts").where("status", "==", "pending_delete").get().then(snapshot => {
    if (snapshot.empty) {
      wrap.innerHTML = `<div class="empty-state">Tasdiqlash kutilayotgan o'chirishlar yo'q.</div>`;
      return;
    }
    wrap.innerHTML = "";
    snapshot.forEach(doc => {
      const post = doc.data();
      const displayName = post.authorIsAdmin && post.authorSpecialName ? post.authorSpecialName : post.authorNickname;
      const row = document.createElement("div");
      row.className = "admin-user-row";
      row.innerHTML = `
        <div class="row-top">
          <div>
            <div class="u-name">${escapeHtml(displayName)}</div>
            <div class="u-username">${escapeHtml(post.section)} — ${escapeHtml((post.text || "").slice(0, 60))}</div>
          </div>
        </div>
        <div class="row-actions">
          <button class="btn btn-sm restore-btn">Tiklash</button>
          <button class="btn btn-sm btn-danger confirm-delete-btn">Butunlay o'chirish</button>
        </div>
      `;
      row.querySelector(".restore-btn").addEventListener("click", () => restorePost(doc.id));
      row.querySelector(".confirm-delete-btn").addEventListener("click", () => confirmDeletePost(doc.id, post));
      wrap.appendChild(row);
    });
  });
}

function restorePost(postId) {
  db.collection("posts").doc(postId).update({
    status: "active",
    deletedBy: firebase.firestore.FieldValue.delete(),
    deletedAt: firebase.firestore.FieldValue.delete()
  }).then(() => { showToast("Tiklandi."); loadPendingDeletions(); })
    .catch(err => { console.error(err); showToast("Xatolik yuz berdi."); });
}

async function confirmDeletePost(postId, post) {
  if (!confirm("Butunlay o'chirishni tasdiqlaysizmi? Bu amalni orqaga qaytarib bo'lmaydi.")) return;
  try {
    if (post && post.mediaPath) {
      await deleteFromSupabase(post.mediaPath);
    }
    await db.collection("posts").doc(postId).delete();
    showToast("Butunlay o'chirildi.");
    loadPendingDeletions();
  } catch (err) {
    console.error(err);
    showToast("Xatolik yuz berdi.");
  }
}

// ---------------- Admin profile tab (qiyomatligim nomi) ----------------
function loadAdminProfile() {
  document.getElementById("special-name-input").value = currentUser.specialName || "";
}

document.getElementById("save-special-name-btn").addEventListener("click", async () => {
  const val = document.getElementById("special-name-input").value.trim();
  try {
    await db.collection("users").doc(currentUser.uid).update({ specialName: val || null });
    currentUser.specialName = val || null;
    const displayName = val || currentUser.nickname;
    document.getElementById("welcome-text").textContent = `Xush kelibsiz, ${displayName}!`;
    showToast("Saqlandi.");
  } catch (err) {
    console.error(err);
    showToast("Xatolik yuz berdi.");
  }
});
