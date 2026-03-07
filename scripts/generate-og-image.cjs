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
  const logoPath = path.join(repoRoot, "public", "apple-touch-icon.png");
  const outPath = path.join(repoRoot, "public", "og-image.png");

  if (!fs.existsSync(syne700Path)) {
    throw new Error(`Syne font not found at: ${syne700Path}`);
  }
  // eslint-disable-next-line no-console
  console.log("Syne font:", syne700Path);

  if (!fs.existsSync(logoPath)) {
    throw new Error(`Logo not found at: ${logoPath}`);
  }

  const logoBuffer = fs.readFileSync(logoPath);
  const logoBase64 = logoBuffer.toString("base64");
  const logoDataUri = `data:image/png;base64,${logoBase64}`;

  // Logo: 180x180 source scaled to 80x80 in SVG (sharp at display size). Centered, 16px gap above title.
  // Title 140px, tagline 40px. Layout: logo y=140, bottom 220, gap 16, title baseline ~368, tagline ~422.
  const logoX = (W - 80) / 2;
  const logoY = 140;
  const titleBaseline = 368;
  const taglineBaseline = 422;
  const titleFontSize = 140;
  const taglineFontSize = 40;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0a0a0f"/>
  <image href="${logoDataUri}" x="${logoX}" y="${logoY}" width="80" height="80"/>
  <text x="${W / 2}" y="${titleBaseline}" text-anchor="middle" fill="white" font-size="${titleFontSize}" font-weight="700" font-family="Syne">Noisebrief</text>
  <text x="${W / 2}" y="${taglineBaseline}" text-anchor="middle" fill="#00d4aa" font-size="${taglineFontSize}" font-family="Syne">Today's tech noise. Briefly.</text>
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
