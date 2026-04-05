import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');
const logoPath = path.join(publicDir, 'if-logo.png');

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-180.png', size: 180 },
  { name: 'icon-167.png', size: 167 },
  { name: 'icon-152.png', size: 152 },
];

async function generate() {
  const logo = sharp(logoPath);
  const meta = await logo.metadata();
  console.log(`Source logo: ${meta.width}x${meta.height}`);

  for (const { name, size } of sizes) {
    // Logo fills ~78% of the icon, centered on white
    const logoSize = Math.round(size * 0.78);
    const resizedLogo = await sharp(logoPath)
      .resize(logoSize, logoSize, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: resizedLogo, gravity: 'centre' }])
      .png()
      .toFile(path.join(publicDir, name));

    console.log(`Created ${name} (${size}x${size})`);
  }
}

generate().catch(err => { console.error(err); process.exit(1); });
