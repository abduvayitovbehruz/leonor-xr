// ==========================================================
// CLOUDINARY SOZLAMALARI (rasm/video bepul saqlash uchun)
// cloudinary.com da bepul hisob oching va quyidagilarni to'ldiring
// ==========================================================
const CLOUDINARY_CLOUD_NAME = "BU_YERGA_CLOUD_NAME";
const CLOUDINARY_UPLOAD_PRESET = "BU_YERGA_UPLOAD_PRESET";

function uploadToCloudinary(file, resourceType, onProgress) {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } catch (e) {
          reject(new Error("Javobni o'qib bo'lmadi"));
        }
      } else {
        reject(new Error("Yuklash muvaffaqiyatsiz: " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Tarmoq xatosi"));
    xhr.send(formData);
  });
}
