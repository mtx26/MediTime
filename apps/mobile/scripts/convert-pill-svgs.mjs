import sharp from 'sharp';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pillsDir = join(__dirname, '../assets/icons/pills');

const svgs = readdirSync(pillsDir).filter(f => f.endsWith('.svg'));

for (const svg of svgs) {
  const input = join(pillsDir, svg);
  const output = join(pillsDir, svg.replace('.svg', '.png'));
  await sharp(input, { density: 300 })
    .resize(320, 320)
    .png()
    .toFile(output);
  console.log(`✓ ${svg} → ${svg.replace('.svg', '.png')}`);
}
console.log('Done.');
