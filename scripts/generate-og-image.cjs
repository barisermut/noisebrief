const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const W = 1200;
const H = 630;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0a0a0f"/>
  <text x="${W / 2}" y="280" text-anchor="middle" fill="white" font-size="120" font-weight="bold" font-family="system-ui, -apple-system, sans-serif">Noisebrief</text>
  <text x="${W / 2}" y="360" text-anchor="middle" fill="#00d4aa" font-size="36" font-family="system-ui, -apple-system, sans-serif">Today's tech noise. Briefly.</text>
  <text x="${W / 2}" y="580" text-anchor="middle" fill="#71717a" font-size="24" font-family="system-ui, -apple-system, sans-serif">noisebrief.vercel.app</text>
</svg>
`.trim();

async function main() {
  const repoRoot = path.join(__dirname, "..");
  const outPath = path.join(repoRoot, "public", "og-image.png");

  const buffer = Buffer.from(svg);
  await sharp(buffer)
    .resize(W, H)
    .png()
    .toFile(outPath);

  const stat = fs.statSync(outPath);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(repoRoot, outPath)} (${stat.size} bytes)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
