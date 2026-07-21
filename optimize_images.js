import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const assetsDir = path.join(__dirname, 'src', 'assets');

async function optimizeImages() {
  try {
    console.log('Optimizing live_telemetry.png...');
    await sharp(path.join(assetsDir, 'live_telemetry.png'))
      .resize(100, 100, { fit: 'inside' })
      .webp({ quality: 80 })
      .toFile(path.join(assetsDir, 'live_telemetry.webp'));
      
    console.log('Optimizing starry-bg.png...');
    await sharp(path.join(assetsDir, 'starry-bg.png'))
      .webp({ quality: 60 })
      .toFile(path.join(assetsDir, 'starry-bg.webp'));
      
    console.log('Images optimized successfully.');
  } catch (err) {
    console.error('Error optimizing images:', err);
  }
}

optimizeImages();
