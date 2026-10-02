const fileInput = document.querySelector("#file");
const uploadBtn = document.querySelector("#uploadBtn");
const dropzone = document.querySelector("#dropzone");
const dropTitle = document.querySelector("#dropTitle");
const dropText = document.querySelector("#dropText");
const statusBox = document.querySelector("#status");
const result = document.querySelector("#result");
const preview = document.querySelector("#preview");
const urlInput = document.querySelector("#url");
const copyBtn = document.querySelector("#copyBtn");
const openBtn = document.querySelector("#openBtn");

let selectedFile = null;

function setStatus(message, error = false) {
  statusBox.textContent = message;
  statusBox.classList.remove("hidden");
  statusBox.style.background = error ? "#fff0f0" : "#f2f2f2";
}

function selectFile(file) {
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    setStatus("Format tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.", true);
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    setStatus("Ukuran file maksimal 10 MB.", true);
    return;
  }

  selectedFile = file;
  dropTitle.textContent = file.name;
  dropText.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
  uploadBtn.disabled = false;
  result.classList.add("hidden");
  statusBox.classList.add("hidden");
}

fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));

["dragenter", "dragover"].forEach(eventName => {
  dropzone.addEventListener(eventName, e => {
    e.preventDefault();
    dropzone.classList.add("drag");
  });
});
["dragleave", "drop"].forEach(eventName => {
  dropzone.addEventListener(eventName, e => {
    e.preventDefault();
    dropzone.classList.remove("drag");
  });
});
dropzone.addEventListener("drop", e => selectFile(e.dataTransfer.files[0]));

uploadBtn.addEventListener("click", async () => {
  if (!selectedFile) return;

  uploadBtn.disabled = true;
  setStatus("Mengupload...");

  const form = new FormData();
  form.append("file", selectedFile);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: form
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "Upload gagal.");
    }

    urlInput.value = data.url;
    preview.src = data.url;
    openBtn.href = data.url;
    result.classList.remove("hidden");
    setStatus("Upload berhasil.");
  } catch (error) {
    setStatus(error.message || "Terjadi kesalahan.", true);
  } finally {
    uploadBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(urlInput.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => copyBtn.textContent = "Copy", 1200);
  } catch {
    urlInput.select();
    document.execCommand("copy");
  }
});
