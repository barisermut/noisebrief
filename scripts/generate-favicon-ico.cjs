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

  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = sizes.map((size) => {
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: size } });
    return resvg.render().asPng();
  });

  const icoBuffer = await pngToIco(pngBuffers);
  fs.writeFileSync(outPath, icoBuffer);
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(repoRoot, outPath)} (${icoBuffer.length} bytes)`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

