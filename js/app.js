// ==========================================================
// BO'LIMLAR SOZLAMASI
// ==========================================================
const SECTIONS = [
  { id: "hissiyotlarim", title: "Hissiyotlarim", icon: "ti-heart", fields: ["text"] },
  { id: "orzularim", title: "Orzularim", icon: "ti-cloud", fields: ["text", "description", "media"] },
  { id: "rejalarim", title: "Rejalarim", icon: "ti-checklist", fields: ["text", "description", "media"] },
  { id: "xotiralar", title: "Xotiralar", icon: "ti-photo", fields: ["text", "description", "media"] },
  { id: "muvaffaqiyatlarim", title: "Muvaffaqiyatlarim", icon: "ti-trophy", fields: ["text", "media"] },
  { id: "erishilgan_maqsadlar", title: "Erishilgan maqsadlar", icon: "ti-target", fields: ["text", "description", "media"] },
  { id: "sayohatlar", title: "Sayohatlar", icon: "ti-plane", fields: ["text", "description", "media"] }
];

let currentSectionId = SECTIONS[0].id;
let postsUnsubscribe = null;
let pendingMediaFile = null; // {file, type}

const drawer = document.getElementById("drawer");
const drawerOverlay = document.getElementById("drawer-overlay");
const navList = document.getElementById("nav-list");
const contentEl = document.getElementById("content");

function initAppAfterLogin() {
  renderNav();
  switchSection(currentSectionId);
  startFloatingStickers();
}

// ---------------- Drawer ----------------
document.getElementById("hamburger-btn").addEventListener("click", () => {
  drawer.classList.add("open");
  drawerOverlay.classList.add("open");
});
function closeDrawer() {
  drawer.classList.remove("open");
  drawerOverlay.classList.remove("open");
}
drawerOverlay.addEventListener("click", closeDrawer);

function renderNav() {
  navList.innerHTML = "";
  SECTIONS.forEach(sec => {
    const item = document.createElement("div");
    item.className = "nav-item" + (sec.id === currentSectionId ? " active" : "");
    item.innerHTML = `<i class="ti ${sec.icon}"></i><span>${sec.title}</span>`;
    item.addEventListener("click", () => {
      currentSectionId = sec.id;
      closeDrawer();
      renderNav();
      switchSection(sec.id);
    });
    navList.appendChild(item);
  });
}

// ---------------- Section switching ----------------
function switchSection(sectionId) {
  const section = SECTIONS.find(s => s.id === sectionId);
  if (postsUnsubscribe) { postsUnsubscribe(); postsUnsubscribe = null; }

  contentEl.innerHTML = `
    <div class="section-header">
      <h2>${section.title}</h2>
      <p>Ikkalangiz uchun maxsus joy.</p>
    </div>
    <div id="post-form-wrap"></div>
    <div id="posts-list"></div>
  `;

  renderPostForm(section);
  loadPosts(section);
}

// ---------------- Post form ----------------
function renderPostForm(section) {
  const wrap = document.getElementById("post-form-wrap");
  pendingMediaFile = null;

  let mediaHtml = "";
  if (section.fields.includes("media")) {
    mediaHtml = `
      <div class="file-row" id="file-row">
        <label class="file-label" id="image-label">
          <i class="ti ti-photo" aria-hidden="true"></i> Rasm qo'shish
          <input type="file" id="image-input" accept="image/*">
        </label>
        <label class="file-label" id="video-label">
          <i class="ti ti-video" aria-hidden="true"></i> Video qo'shish
          <input type="file" id="video-input" accept="video/*">
        </label>
      </div>
      <div id="media-preview" class="hidden" style="margin-bottom:10px;"></div>
    `;
  }

  let descHtml = "";
  if (section.fields.includes("description")) {
    descHtml = `<input type="text" id="desc-input" placeholder="Qisqa tavsif yozing...">`;
  }

  wrap.innerHTML = `
    <div class="post-form">
      <textarea id="text-input" rows="3" placeholder="Bu yerga yozing..."></textarea>
      ${descHtml}
      ${mediaHtml}
      <div id="upload-progress" style="font-size:12px;color:var(--text-muted);margin-bottom:8px;"></div>
      <button class="btn btn-primary btn-block" id="submit-post-btn">
        <i class="ti ti-send" aria-hidden="true"></i> Joylash
      </button>
    </div>
  `;

  if (section.fields.includes("media")) {
    document.getElementById("image-input").addEventListener("change", (e) => {
      if (e.target.files[0]) {
        pendingMediaFile = { file: e.target.files[0], type: "image" };
        updateMediaPreview();
      }
    });
    document.getElementById("video-input").addEventListener("change", (e) => {
      if (e.target.files[0]) {
        pendingMediaFile = { file: e.target.files[0], type: "video" };
        updateMediaPreview();
      }
    });
  }

  document.getElementById("submit-post-btn").addEventListener("click", () => submitPost(section));
}

function updateMediaPreview() {
  const fileRow = document.getElementById("file-row");
  const preview = document.getElementById("media-preview");
  if (!preview) return;

  if (!pendingMediaFile) {
    preview.classList.add("hidden");
    preview.innerHTML = "";
    if (fileRow) fileRow.classList.remove("hidden");
    return;
  }

  if (fileRow) fileRow.classList.add("hidden");
  preview.classList.remove("hidden");
  const icon = pendingMediaFile.type === "video" ? "ti-video" : "ti-photo";
  preview.innerHTML = `
    <div class="file-label has-file" style="justify-content:space-between;">
      <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><i class="ti ${icon}" aria-hidden="true"></i> ${escapeHtml(pendingMediaFile.file.name)}</span>
      <button type="button" id="remove-media-btn" class="icon-mini" aria-label="Olib tashlash" style="flex-shrink:0;"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>
  `;
  document.getElementById("remove-media-btn").addEventListener("click", () => {
    pendingMediaFile = null;
    const imgInput = document.getElementById("image-input");
    const vidInput = document.getElementById("video-input");
    if (imgInput) imgInput.value = "";
    if (vidInput) vidInput.value = "";
    updateMediaPreview();
  });
}

async function submitPost(section) {
  const textInput = document.getElementById("text-input");
  const text = textInput.value.trim();
  const descInput = document.getElementById("desc-input");
  const description = descInput ? descInput.value.trim() : "";

  if (!text && !pendingMediaFile) {
    showToast("Matn yoki media qo'shing.");
    return;
  }

  const btn = document.getElementById("submit-post-btn");
  btn.disabled = true;
  btn.textContent = "Joylanmoqda...";

  try {
    const postData = {
      section: section.id,
      text: text,
      description: description || null,
      authorUid: currentUser.uid,
      authorNickname: currentUser.nickname,
      authorIsAdmin: currentUser.isAdmin,
      authorSpecialName: currentUser.specialName || null,
      status: "active",
      likes: {},
      mediaUrl: null,
      mediaType: null,
      mediaPath: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection("posts").add(postData);

    if (pendingMediaFile) {
      const progressEl = document.getElementById("upload-progress");
      const folder = `${section.id}/${docRef.id}`;
      const result = await uploadToSupabase(pendingMediaFile.file, folder, (pct) => {
        if (progressEl) progressEl.textContent = `Yuklanmoqda... ${pct}%`;
      });
      await docRef.update({ mediaUrl: result.url, mediaType: pendingMediaFile.type, mediaPath: result.path });
    }

    renderPostForm(section);
    showToast("Joylandi.");
  } catch (err) {
    console.error(err);
    showToast("Xatolik yuz berdi.");
    btn.disabled = false;
    btn.textContent = "Joylash";
  }
}

// ---------------- Load & render posts ----------------
function loadPosts(section) {
  const listEl = document.getElementById("posts-list");
  postsUnsubscribe = db.collection("posts")
    .where("section", "==", section.id)
    .where("status", "==", "active")
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      if (snapshot.empty) {
        listEl.innerHTML = `<div class="empty-state">Hali hech narsa yo'q. Birinchi bo'lib yozing.</div>`;
        return;
      }
      listEl.innerHTML = "";
      snapshot.forEach(doc => {
        listEl.appendChild(renderPostCard(doc.id, doc.data()));
      });
    }, (err) => {
      console.error(err);
      listEl.innerHTML = `<div class="empty-state">Ma'lumotlarni yuklab bo'lmadi.</div>`;
    });
}

function renderPostCard(postId, post) {
  const el = document.createElement("div");
  el.className = "post-card";

  const displayName = post.authorIsAdmin && post.authorSpecialName ? post.authorSpecialName : post.authorNickname;
  const isAdminAuthor = !!post.authorIsAdmin;
  const canManage = currentUser.isAdmin || post.authorUid === currentUser.uid;
  const dateStr = post.createdAt ? formatDate(post.createdAt.toDate()) : "hozir";
  const likesObj = post.likes || {};
  const likeCount = Object.keys(likesObj).length;
  const iLiked = !!likesObj[currentUser.uid];

  let mediaHtml = "";
  if (post.mediaUrl) {
    if (post.mediaType === "video") {
      mediaHtml = `<video class="post-media" src="${post.mediaUrl}" controls></video>`;
    } else {
      mediaHtml = `<img class="post-media" src="${post.mediaUrl}" alt="">`;
    }
  }

  el.innerHTML = `
    <div class="post-author-row">
      <div class="avatar ${isAdminAuthor ? "admin" : ""}">${initialsFor(displayName)}</div>
      <div>
        <div class="post-author-name ${isAdminAuthor ? "admin" : ""}">${escapeHtml(displayName)}</div>
        <div class="post-date">${dateStr}</div>
      </div>
      ${canManage ? `<div class="post-owner-actions">
        <button class="icon-mini edit-post-btn" aria-label="Tahrirlash"><i class="ti ti-edit" aria-hidden="true"></i></button>
        <button class="icon-mini delete-post-btn" aria-label="O'chirish"><i class="ti ti-trash" aria-hidden="true"></i></button>
      </div>` : ""}
    </div>
    ${post.description ? `<p class="post-description">${escapeHtml(post.description)}</p>` : ""}
    ${post.text ? `<p class="post-text">${escapeHtml(post.text)}</p>` : ""}
    ${mediaHtml}
    <div class="post-actions-row">
      <button class="action-btn like-btn ${iLiked ? "liked" : ""}"><i class="ti ti-heart" aria-hidden="true"></i><span>${likeCount}</span></button>
      <button class="action-btn comment-toggle-btn"><i class="ti ti-message-circle" aria-hidden="true"></i><span>Komment</span></button>
    </div>
    <div class="comments-wrap hidden" id="comments-${postId}"></div>
  `;

  el.querySelector(".like-btn").addEventListener("click", () => toggleLike(postId, likesObj));
  el.querySelector(".comment-toggle-btn").addEventListener("click", () => toggleComments(postId));
  if (canManage) {
    el.querySelector(".delete-post-btn").addEventListener("click", () => deletePost(postId, post));
    el.querySelector(".edit-post-btn").addEventListener("click", () => editPost(postId, post));
  }

  return el;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "hozir";
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} soat oldin`;
  return date.toLocaleDateString("uz-UZ", { day: "numeric", month: "long", year: "numeric" });
}

// ---------------- Likes ----------------
async function toggleLike(postId, likesObj) {
  const liked = !!likesObj[currentUser.uid];
  const field = `likes.${currentUser.uid}`;
  try {
    await db.collection("posts").doc(postId).update({
      [field]: liked ? firebase.firestore.FieldValue.delete() : true
    });
  } catch (err) {
    console.error(err);
  }
}

// ---------------- Delete / Edit post ----------------
async function deletePost(postId, post) {
  if (!confirm("Rostdan ham o'chirmoqchimisiz?")) return;
  try {
    if (currentUser.isAdmin) {
      if (post.mediaPath) await deleteFromSupabase(post.mediaPath);
      await db.collection("posts").doc(postId).delete();
      showToast("O'chirildi.");
    } else {
      await db.collection("posts").doc(postId).update({
        status: "pending_delete",
        deletedBy: currentUser.uid,
        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast("O'chirildi.");
    }
  } catch (err) {
    console.error(err);
    showToast("Xatolik yuz berdi.");
  }
}

async function editPost(postId, post) {
  const newText = prompt("Matnni tahrirlang:", post.text || "");
  if (newText === null) return;

  const updateData = { text: newText.trim() };

  const sectionConfig = SECTIONS.find(s => s.id === post.section);
  if (sectionConfig && sectionConfig.fields.includes("description")) {
    const newDescription = prompt("Tavsifni tahrirlang:", post.description || "");
    if (newDescription !== null) {
      updateData.description = newDescription.trim() || null;
    }
  }

  try {
    await db.collection("posts").doc(postId).update(updateData);
    showToast("Yangilandi.");
  } catch (err) {
    console.error(err);
    showToast("Xatolik yuz berdi.");
  }
}

// ---------------- Comments ----------------
function toggleComments(postId) {
  const wrap = document.getElementById(`comments-${postId}`);
  const isHidden = wrap.classList.contains("hidden");
  wrap.classList.toggle("hidden");
  if (isHidden && !wrap.dataset.loaded) {
    wrap.dataset.loaded = "1";
    loadComments(postId, wrap);
  }
}

function loadComments(postId, wrap) {
  db.collection("posts").doc(postId).collection("comments")
    .orderBy("createdAt", "asc")
    .onSnapshot((snapshot) => {
      const topLevel = [];
      const byParent = {};
      snapshot.forEach(doc => {
        const c = { id: doc.id, ...doc.data() };
        if (c.parentId) {
          byParent[c.parentId] = byParent[c.parentId] || [];
          byParent[c.parentId].push(c);
        } else {
          topLevel.push(c);
        }
      });

      let html = `<div id="comment-items-${postId}"></div>
        <div class="comment-input-row">
          <input type="text" id="comment-input-${postId}" placeholder="Komment yozing...">
          <button class="comment-send" id="comment-send-${postId}"><i class="ti ti-send" aria-hidden="true"></i></button>
        </div>`;
      wrap.innerHTML = html;

      const itemsEl = document.getElementById(`comment-items-${postId}`);
      if (topLevel.length === 0) {
        itemsEl.innerHTML = `<p style="font-size:12px;color:var(--text-muted);">Hali komment yo'q.</p>`;
      } else {
        topLevel.forEach(c => {
          itemsEl.appendChild(renderComment(postId, c, byParent));
        });
      }

      document.getElementById(`comment-send-${postId}`).addEventListener("click", () => {
        submitComment(postId, null);
      });
      document.getElementById(`comment-input-${postId}`).addEventListener("keydown", (e) => {
        if (e.key === "Enter") submitComment(postId, null);
      });
    });
}

function renderComment(postId, comment, byParent) {
  const el = document.createElement("div");
  el.className = "comment";
  const displayName = comment.authorIsAdmin && comment.authorSpecialName ? comment.authorSpecialName : comment.authorNickname;
  const isAdminAuthor = !!comment.authorIsAdmin;
  const canDelete = currentUser.isAdmin || comment.authorUid === currentUser.uid;
  const childReplies = byParent[comment.id] || [];

  el.innerHTML = `
    <div class="comment-row">
      <div class="avatar ${isAdminAuthor ? "admin" : ""}" style="width:28px;height:28px;font-size:11px;">${initialsFor(displayName)}</div>
      <div class="comment-body">
        <div class="comment-author ${isAdminAuthor ? "admin" : ""}">${escapeHtml(displayName)}</div>
        <p class="comment-text">${escapeHtml(comment.text)}</p>
        <div class="comment-meta">
          <button class="reply-btn">Javob berish</button>
          ${canDelete ? `<button class="delete-comment-btn">O'chirish</button>` : ""}
        </div>
        <div class="reply-input-wrap hidden">
          <div class="comment-input-row">
            <input type="text" placeholder="Javob yozing..." class="reply-input">
            <button class="comment-send reply-send"><i class="ti ti-send" aria-hidden="true"></i></button>
          </div>
        </div>
        <div class="reply-list"></div>
      </div>
    </div>
  `;

  const replyBtn = el.querySelector(".reply-btn");
  const replyInputWrap = el.querySelector(".reply-input-wrap");
  replyBtn.addEventListener("click", () => replyInputWrap.classList.toggle("hidden"));
  el.querySelector(".reply-send").addEventListener("click", () => {
    const input = el.querySelector(".reply-input");
    if (input.value.trim()) {
      submitComment(postId, comment.id, input.value.trim());
      input.value = "";
      replyInputWrap.classList.add("hidden");
    }
  });
  if (canDelete) {
    el.querySelector(".delete-comment-btn").addEventListener("click", () => deleteComment(postId, comment.id));
  }

  const replyListEl = el.querySelector(".reply-list");
  childReplies.forEach(r => {
    const rEl = renderComment(postId, r, byParent);
    rEl.style.marginTop = "8px";
    replyListEl.appendChild(rEl);
  });

  return el;
}

async function submitComment(postId, parentId, textOverride) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = textOverride !== undefined ? textOverride : (input ? input.value.trim() : "");
  if (!text) return;

  try {
    await db.collection("posts").doc(postId).collection("comments").add({
      text,
      parentId: parentId || null,
      authorUid: currentUser.uid,
      authorNickname: currentUser.nickname,
      authorIsAdmin: currentUser.isAdmin,
      authorSpecialName: currentUser.specialName || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    if (input && textOverride === undefined) input.value = "";
  } catch (err) {
    console.error(err);
    showToast("Xatolik yuz berdi.");
  }
}

async function deleteComment(postId, commentId) {
  if (!confirm("Kommentni o'chirmoqchimisiz?")) return;
  try {
    await db.collection("posts").doc(postId).collection("comments").doc(commentId).delete();
  } catch (err) {
    console.error(err);
  }
}

// ---------------- Toast ----------------
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

// ---------------- Floating background stickers ----------------
function startFloatingStickers() {
  const layer = document.getElementById("sticker-layer");
  if (layer.dataset.started) return;
  layer.dataset.started = "1";
  const emojis = ["💕", "😊", "✨", "💛", "🥰", "😄", "💫", "😌"];
  setInterval(() => {
    const s = document.createElement("span");
    s.className = "sticker";
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    s.style.left = Math.random() * 92 + "%";
    const duration = 14 + Math.random() * 10;
    s.style.animationDuration = duration + "s";
    s.style.fontSize = (20 + Math.random() * 18) + "px";
    layer.appendChild(s);
    setTimeout(() => s.remove(), duration * 1000 + 500);
  }, 1800);
}
