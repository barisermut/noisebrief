const sharp = require("sharp");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const inputSvg = path.join(publicDir, "favicon.svg");

async function generate() {
  await sharp(inputSvg).resize(32, 32).png().toFile(path.join(publicDir, "favicon-32x32.png"));
  await sharp(inputSvg).resize(180, 180).png().toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Generated favicon-32x32.png and apple-touch-icon.png");
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
