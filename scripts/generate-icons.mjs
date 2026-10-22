/**
 * Builds the browser-tab and home-screen icons from the TCO logo: the duck
 * loop, white on the app background.
 * Usage: node scripts/generate-icons.mjs
 * Writes app/favicon.ico (16/32/48), app/icon.png (192), app/apple-icon.png (180).
 */
import sharp from "sharp";
import path from "path";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const input = path.join(root, "public/assets/tco-logo.png");
const BG = "#0e0e10"; // --color-bg

// The duck loop of the 800x800 logo, cropped at the point where it crosses the C.
const DUCK = { left: 484, top: 250, width: 206, height: 235 };

async function whiteMark() {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .extract(DUCK)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Black ink on transparent/white -> white ink, alpha from darkness
  for (let i = 0; i < data.length; i += 4) {
    const lum = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i + 3] = Math.round((data[i + 3] * (255 - lum)) / 255);
    data[i] = data[i + 1] = data[i + 2] = 255;
  }

  return sharp(data, { raw: info }).trim({ threshold: 1 }).png().toBuffer();
}

async function tile(mark, size, { rounded }) {
  const inner = Math.round(size * 0.76);
  const art = await sharp(mark)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  const rx = rounded ? Math.round(size * 0.22) : 0;
  const bg = Buffer.from(
    `<svg width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${rx}" fill="${BG}"/></svg>`
  );
  return sharp(bg).composite([{ input: art, gravity: "center" }]).png().toBuffer();
}

// ICO container holding PNG frames (supported by every current browser)
function ico(frames) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  const entries = [];
  let offset = 6 + 16 * frames.length;
  for (const { size, png } of frames) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...frames.map((f) => f.png)]);
}

async function generate() {
  const mark = await whiteMark();

  const frames = [];
  for (const size of [16, 32, 48]) frames.push({ size, png: await tile(mark, size, { rounded: true }) });
  await writeFile(path.join(root, "app/favicon.ico"), ico(frames));

  await writeFile(path.join(root, "app/icon.png"), await tile(mark, 192, { rounded: true }));
  // iOS applies its own corner mask
  await writeFile(path.join(root, "app/apple-icon.png"), await tile(mark, 180, { rounded: false }));

  console.log("Icons written to app/");
}

generate().catch(console.error);
