// Converts every frame_XXX.png in public/hero-frames into a small .webp
// Run from the `frontend` folder:   node convert-frames.mjs
import fs from "fs";
import path from "path";
import sharp from "sharp";

const DIR = path.join("public", "hero-frames");
const WIDTH = 1920;     // output width in pixels
const QUALITY = 92;     // 1-100, lower = smaller files

const files = fs
  .readdirSync(DIR)
  .filter((f) => /^frame_\d+\.png$/i.test(f))
  .sort();

if (files.length === 0) {
  console.log("No frame_###.png files found in " + DIR);
  process.exit(1);
}

for (const f of files) {
  const out = path.join(DIR, f.replace(/\.png$/i, ".webp"));
  await sharp(path.join(DIR, f))
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(out);
}

console.log("Done. Converted " + files.length + " frames.");
console.log("In Hero.jsx set FRAME_COUNT = " + files.length + ", FRAME_DIGITS = 3, FRAME_EXT = \"webp\"");
