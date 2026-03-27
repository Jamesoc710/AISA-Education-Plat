/**
 * Removes white background from the AISA logo and outputs a transparent PNG.
 * Usage: node scripts/process-logo.mjs
 */
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(__dirname, "../../New logo.png");
const output = path.resolve(__dirname, "../public/assets/aisa-logo.png");

async function processLogo() {
  const image = sharp(input);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Remove white/near-white pixels with smooth edge transitions
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate "whiteness" — how close to pure white
    const minChannel = Math.min(r, g, b);
    const brightness = (r + g + b) / 3;

    if (brightness > 240 && minChannel > 220) {
      // Very white — fully transparent
      data[i + 3] = 0;
    } else if (brightness > 200 && minChannel > 180) {
      // Near-white — partial transparency for smooth edges
      const factor = (brightness - 200) / 55; // 0 to ~1
      data[i + 3] = Math.round(data[i + 3] * (1 - factor));
    }
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .resize(128, 128, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(output);

  console.log(`Logo processed: ${output}`);
}

processLogo().catch(console.error);
