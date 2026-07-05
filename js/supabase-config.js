// ==========================================================
// SUPABASE SOZLAMALARI (rasm/video bepul saqlash uchun)
// supabase.com da bepul hisob oching va quyidagilarni to'ldiring
// ==========================================================
const SUPABASE_URL = "https://vjbatcvqiujtdjlvzixx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-WzEI2M8Rg8yKs3ZxjxFIw_y51f7ccR";
const SUPABASE_BUCKET = "media";

function uploadToSupabase(file, folder, onProgress) {
  return new Promise((resolve, reject) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${folder}/${Date.now()}_${safeName}`;
    const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("apikey", SUPABASE_ANON_KEY);
    xhr.setRequestHeader("Authorization", `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
        resolve({ url: publicUrl, path });
      } else {
        reject(new Error("Yuklash muvaffaqiyatsiz: " + xhr.status + " " + xhr.responseText));
      }
    };
    xhr.onerror = () => reject(new Error("Tarmoq xatosi"));
    xhr.send(file);
  });
}

async function deleteFromSupabase(path) {
  if (!path) return;
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;
    await fetch(url, {
      method: "DELETE",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
  } catch (err) {
    console.error("Faylni o'chirishda xatolik:", err);
  }
}
