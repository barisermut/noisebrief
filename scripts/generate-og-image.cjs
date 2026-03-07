const fs = require("node:fs");
const path = require("node:path");
const { Resvg } = require("@resvg/resvg-js");

const W = 1200;
const H = 630;

// Syne 700 (bold) from @fontsource/syne — path for Resvg fontFiles
const syne700Path = path.join(
  __dirname,
  "..",
  "node_modules",
  "@fontsource",
  "syne",
  "files",
  "syne-latin-700-normal.woff2"
);

function main() {
  const repoRoot = path.join(__dirname, "..");
  const faviconPath = path.join(repoRoot, "public", "favicon-32x32.png");
  const outPath = path.join(repoRoot, "public", "og-image.png");

  const faviconBuffer = fs.readFileSync(faviconPath);
  const faviconBase64 = faviconBuffer.toString("base64");
  const faviconDataUri = `data:image/png;base64,${faviconBase64}`;

  // Logo: 80x80, centered (x = (1200-80)/2 = 560). Place logo so 16px gap above "Noisebrief".
  // Title "Noisebrief" ~120px font, baseline roughly 100px from top of text. We want block centered.
  // Logo top y=164, logo bottom 244. Gap 16. Text top 260. Baseline for 120px Syne ~350. Tagline baseline ~410.
  const logoX = (W - 80) / 2;
  const logoY = 164;
  const titleBaseline = 350;
  const taglineBaseline = 410;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0a0a0f"/>
  <image href="${faviconDataUri}" x="${logoX}" y="${logoY}" width="80" height="80"/>
  <text x="${W / 2}" y="${titleBaseline}" text-anchor="middle" fill="white" font-size="120" font-weight="700" font-family="Syne">Noisebrief</text>
  <text x="${W / 2}" y="${taglineBaseline}" text-anchor="middle" fill="#00d4aa" font-size="36" font-family="Syne">Today's tech noise. Briefly.</text>
</svg>
`.trim();

  const resvg = new Resvg(svg, {
    fitTo: { mode: "original" },
    font: {
      fontFiles: [syne700Path],
      loadSystemFonts: true,
      defaultFontFamily: "Syne",
    },
  });

  const pngBuffer = resvg.render().asPng();
  fs.writeFileSync(outPath, pngBuffer);

  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(repoRoot, outPath)} (${pngBuffer.length} bytes)`);
}

main();
