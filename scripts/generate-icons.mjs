/**
 * Builds the browser-tab and home-screen icons from the AISA logo, centered
 * on a white tile.
 * Usage: node scripts/generate-icons.mjs
 * Writes app/favicon.ico (16/32/48), app/icon.png (192), app/apple-icon.png (180).
 *
 * The source logo is only 128px, so the 180 and 192 icons are slightly
 * upscaled. Swap in a larger public/assets/aisa-logo.png and re-run for
 * crisper home-screen icons.
 */
import sharp from "sharp";
import path from "path";
import { writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const input = path.join(root, "public/assets/aisa-logo.png");
const BG = "#ffffff";

async function logoMark() {
  return sharp(input).ensureAlpha().trim({ threshold: 1 }).png().toBuffer();
}

async function tile(mark, size, { rounded }) {
  const inner = Math.round(size * 0.84);
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
  const mark = await logoMark();

  const frames = [];
  for (const size of [16, 32, 48]) frames.push({ size, png: await tile(mark, size, { rounded: true }) });
  await writeFile(path.join(root, "app/favicon.ico"), ico(frames));

  await writeFile(path.join(root, "app/icon.png"), await tile(mark, 192, { rounded: true }));
  // iOS applies its own corner mask
  await writeFile(path.join(root, "app/apple-icon.png"), await tile(mark, 180, { rounded: false }));

  console.log("Icons written to app/");
}

generate().catch(console.error);
