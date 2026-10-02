const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif"
]);

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

const MAX_SIZE = 10 * 1024 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function randomId(length = 18) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

export async function onRequestPost(context) {
  try {
    const contentType = context.request.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return json({ error: "Gunakan multipart/form-data." }, 415);
    }

    const form = await context.request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return json({ error: "Field 'file' tidak ditemukan." }, 400);
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return json({ error: "Format file tidak didukung." }, 415);
    }

    if (file.size <= 0) {
      return json({ error: "File kosong." }, 400);
    }

    if (file.size > MAX_SIZE) {
      return json({ error: "Ukuran file maksimal 10 MB." }, 413);
    }

    const extension = EXTENSIONS[file.type];
    const key = `uploads/${new Date().toISOString().slice(0, 10)}/${randomId()}.${extension}`;

    await context.env.BUCKET.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable"
      },
      customMetadata: {
        originalName: file.name.slice(0, 200)
      }
    });

    const baseUrl = (context.env.PUBLIC_IMAGE_URL || "").replace(/\/+$/, "");
    if (!baseUrl) {
      return json({
        error: "PUBLIC_IMAGE_URL belum dikonfigurasi."
      }, 500);
    }

    const url = `${baseUrl}/${key}`;

    return json({
      success: true,
      key,
      url,
      size: file.size,
      type: file.type
    }, 201);
  } catch (error) {
    console.error("Upload error:", error);
    return json({ error: "Terjadi kesalahan saat upload." }, 500);
  }
}
