import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const outDir = path.join("assets", "optimized");
fs.mkdirSync(outDir, { recursive: true });

const jobs = [
  { input: "assets/gamma-1.png", output: "buzz-signal-900.webp", resize: { width: 900, height: 900, fit: "cover" }, webp: { quality: 82 } },
  { input: "assets/gamma-1.png", output: "buzz-signal-480.webp", resize: { width: 480, height: 480, fit: "cover" }, webp: { quality: 80 } },
  { input: "assets/gamma-2.png", output: "buzz-portrait-640.webp", resize: { width: 640, height: 640, fit: "cover" }, webp: { quality: 80 } },
  { input: "assets/gamma-6.jpg", output: "buzz-wave-900.webp", resize: { width: 900 }, webp: { quality: 80 } },
  { input: "assets/gamma-3.jpg", output: "buzz-landing-900.webp", resize: { width: 900 }, webp: { quality: 80 } },
  { input: "assets/gamma-4.png", output: "buzz-pack-640.webp", resize: { width: 640 }, webp: { quality: 84 } },
  { input: "assets/gamma-5.png", output: "buzz-report-640.webp", resize: { width: 640 }, webp: { quality: 84 } }
];

for (const job of jobs) {
  const outPath = path.join(outDir, job.output);
  const pipeline = sharp(job.input).resize(job.resize);
  await pipeline.clone().webp(job.webp).toFile(outPath);
  const meta = await sharp(outPath).metadata();
  const bytes = fs.statSync(outPath).size;
  console.log(`${job.output}: ${meta.width}x${meta.height} ${Math.round(bytes / 1024)}KB`);

  const avifOut = outPath.replace(/\.webp$/, ".avif");
  await pipeline.clone().avif({ quality: Math.max(45, (job.webp.quality || 80) - 20) }).toFile(avifOut);
  const avifBytes = fs.statSync(avifOut).size;
  console.log(`${path.basename(avifOut)}: ${Math.round(avifBytes / 1024)}KB`);
}
