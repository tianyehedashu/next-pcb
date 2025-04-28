const sharp = require('sharp');
const fs = require('fs');

(async () => {
  const svgBuffer = fs.readFileSync('public/pcb-logo.svg');
  const pngBuffer = await sharp(svgBuffer)
    .resize(40, 40)
    .png()
    .toBuffer();
  await sharp(pngBuffer)
    .resize(40, 40)
    .toFile('app/favicon.ico');
  console.log('favicon.ico generated!');
})(); 