const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const { Resvg } = require("@resvg/resvg-js");
  const pngToIcoModule = require("png-to-ico");
  const pngToIco = pngToIcoModule?.default ?? pngToIcoModule;

  const repoRoot = path.join(__dirname, "..");
  const svgPath = path.join(repoRoot, "public", "favicon.svg");
  const outPath = path.join(repoRoot, "public", "favicon.ico");

  const svg = fs.readFileSync(svgPath, "utf8");

  // Browsers only use small sizes from .ico; larger icons come from favicon.svg / apple-touch-icon.png.
  const sizes = [16, 32, 48];
  const pngBuffers = sizes.map((size) => {
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
    return resvg.render().asPng();
  });

  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(outPath, icoBuffer);
  console.log(`Wrote ${path.relative(repoRoot, outPath)} (${icoBuffer.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

