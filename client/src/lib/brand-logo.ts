// Turns a chosen image file into a small PNG or JPEG data URL for report branding.
// The browser re-draws the image on a canvas, so what is stored is a plain bitmap:
// no scripts, no metadata, and nothing from an SVG file.
import { LOGO_MAX_HEIGHT, LOGO_MAX_WIDTH, isSafeLogo } from '@shared/branding';

const MAX_FILE_BYTES = 5_000_000;

export async function fileToLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpeg|webp)$/.test(file.type)) throw new Error('Choose a PNG, JPG or WebP image. SVG files are not accepted.');
  if (file.size > MAX_FILE_BYTES) throw new Error('That image is over 5 MB. Choose a smaller one.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That image could not be read.'));
      i.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error('That image could not be read.');
    const scale = Math.min(1, LOGO_MAX_WIDTH / img.naturalWidth, LOGO_MAX_HEIGHT / img.naturalHeight);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This browser cannot prepare images.');
    ctx.drawImage(img, 0, 0, w, h);
    let out = canvas.toDataURL('image/png');
    if (!isSafeLogo(out)) {
      // A photo-like logo is too big as PNG: use JPEG on white instead.
      ctx.globalCompositeOperation = 'destination-over';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      out = canvas.toDataURL('image/jpeg', 0.85);
    }
    if (!isSafeLogo(out)) throw new Error('That logo is too detailed to store. Try a simpler or smaller image.');
    return out;
  } finally {
    URL.revokeObjectURL(url);
  }
}
