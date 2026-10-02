# Image Host — Cloudflare Pages + R2

Simple image hosting seperti Catbox, tanpa VPS.

## Arsitektur

GitHub → Cloudflare Pages → Pages Function → Cloudflare R2

Foto disimpan di R2, sedangkan website dan API dijalankan oleh Cloudflare Pages.

## 1. Buat repository GitHub

Buat repository baru, lalu upload seluruh isi project ini.

## 2. Buat R2 bucket

Di Cloudflare:

1. Buka R2 Object Storage.
2. Create bucket.
3. Beri nama `image-host`.
4. Bucket boleh tetap private untuk upload melalui Pages Function.

Nama bucket harus sama dengan `bucket_name` di `wrangler.toml`.

## 3. Hubungkan R2 ke Pages

Di Cloudflare:

Workers & Pages → project → Settings → Bindings → Add → R2 bucket.

Isi:

- Variable name: `BUCKET`
- R2 bucket: `image-host`

Setelah itu redeploy project.

Alternatifnya, binding R2 dapat dikonfigurasi melalui Wrangler.

## 4. Buat domain gambar

Contoh:

`img.domainkamu.com`

Di R2:

Bucket → Settings → Custom Domains → Add.

Masukkan:

`img.domainkamu.com`

Cloudflare akan membuat konfigurasi DNS yang diperlukan.

Setelah aktif, URL object akan seperti:

`https://img.domainkamu.com/uploads/2026-10-03/xxxxx.jpg`

Custom Domain R2 membuat object dapat diakses publik dan dapat menggunakan cache Cloudflare.

## 5. Atur PUBLIC_IMAGE_URL

Di Cloudflare Pages:

Settings → Variables and Secrets

Buat variable:

`PUBLIC_IMAGE_URL`

Value:

`https://img.domainkamu.com`

Jangan masukkan `/` di bagian akhir.

Redeploy setelah mengubah variable.

Jika menggunakan `wrangler.toml`, ganti:

`https://img.example.com`

dengan domain gambar kamu.

## 6. Domain website

Misalnya:

`https://upload.domainkamu.com`

Di Cloudflare Pages:

Custom domains → Set up a custom domain.

Domain website boleh berbeda dengan domain R2.

Contoh:

- Website: `upload.domainkamu.com`
- Gambar: `img.domainkamu.com`

## 7. Upload melalui API

Endpoint:

`POST /api/upload`

Field multipart:

`file`

Contoh JavaScript:

```js
const form = new FormData();
form.append("file", file);

const response = await fetch("https://upload.domainkamu.com/api/upload", {
  method: "POST",
  body: form
});

const result = await response.json();
console.log(result.url);
```

Response:

```json
{
  "success": true,
  "key": "uploads/2026-10-03/xxxxxxxxxxxxxxxxxx.jpg",
  "url": "https://img.domainkamu.com/uploads/2026-10-03/xxxxxxxxxxxxxxxxxx.jpg",
  "size": 123456,
  "type": "image/jpeg"
}
```

## 8. Batas default

Frontend dan API membatasi:

- JPG
- PNG
- WebP
- GIF
- maksimal 10 MB per file

Untuk mengubah batas, edit `MAX_SIZE` di:

`functions/api/upload.js`

Contoh 20 MB:

```js
const MAX_SIZE = 20 * 1024 * 1024;
```

## 9. Keamanan

Jangan menaruh Cloudflare API Token, R2 access key, atau secret di GitHub.

Project ini menggunakan R2 binding dari Cloudflare sehingga kredensial R2 tidak perlu ditulis di source code.

## 10. Catatan

R2 bucket secara default tidak publik. Hanya domain yang kamu hubungkan sebagai Custom Domain yang digunakan untuk mengakses object secara publik.

Jangan memakai `r2.dev` sebagai domain produksi; Cloudflare menyebut URL tersebut ditujukan untuk penggunaan development/non-production.

## 11. Deploy via GitHub

Di Cloudflare:

Workers & Pages → Create application → Pages → Connect to Git.

Pilih repository GitHub ini.

Untuk project statis ini:

- Build command: kosong
- Build output directory: `public`

Pastikan Functions ikut terdeteksi dari folder `functions/`.

Setelah deploy, buka domain Pages kamu.

## 12. Local development

Install dependency:

```bash
npm install
```

Jalankan:

```bash
npm run dev
```

Untuk local development dengan R2 binding, konfigurasi Pages/Wrangler dapat digunakan sesuai dokumentasi Cloudflare.
