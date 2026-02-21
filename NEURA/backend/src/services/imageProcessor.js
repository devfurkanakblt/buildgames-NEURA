import sharp from 'sharp';
import { uploadToPinata } from './pinata.js';

/**
 * Determine optimal grid dimensions based on image aspect ratio.
 * Used for the client-side tile-grid overlay (BBox tasks only).
 */
function getGridDimensions(width, height) {
    const ratio = width / height;
    if (ratio >= 1.6) return { cols: 4, rows: 3 };
    if (ratio >= 1.1) return { cols: 4, rows: 3 };
    if (ratio >= 0.9) return { cols: 3, rows: 3 };
    if (ratio >= 0.6) return { cols: 3, rows: 4 };
    return { cols: 2, rows: 4 };
}

/**
 * For Object Detection (BBox) tasks.
 * Resizes image to a grid-friendly resolution and uploads to Pinata.
 * Returns grid cols/rows so the frontend can render the tile overlay.
 */
export async function processAndUploadImage(imageBuffer, baseName) {
    console.log('📸 Processing BBox image...');
    const meta = await sharp(imageBuffer).metadata();
    const { cols, rows } = getGridDimensions(meta.width, meta.height);

    const targetWidth = Math.round(Math.min(meta.width, 1200) / cols) * cols;
    const targetHeight = Math.round((targetWidth / meta.width) * meta.height / rows) * rows;

    const resizedBuffer = await sharp(imageBuffer)
        .resize(targetWidth, targetHeight, { fit: 'fill' })
        .jpeg({ quality: 85 })
        .toBuffer();

    const originalCid = await uploadToPinata(resizedBuffer, `${baseName}-original.jpg`);
    console.log(`📤 BBox image uploaded: ipfs://${originalCid} (${cols}×${rows})`);
    return { originalCid, cols, rows };
}

/**
 * For Image Classification tasks.
 * Uploads the image as-is (max 1200px wide) — no grid reshape needed.
 * Returns cols: 1, rows: 1 (stored in DB but ignored by the worker UI).
 */
export async function uploadOriginalOnly(imageBuffer, baseName) {
    console.log('📸 Processing Classification image...');
    const meta = await sharp(imageBuffer).metadata();
    const targetWidth = Math.min(meta.width, 1200);

    const resizedBuffer = await sharp(imageBuffer)
        .resize(targetWidth)
        .jpeg({ quality: 85 })
        .toBuffer();

    const originalCid = await uploadToPinata(resizedBuffer, `${baseName}-original.jpg`);
    console.log(`📤 Classification image uploaded: ipfs://${originalCid}`);
    return { originalCid, cols: 1, rows: 1 };
}

export default { processAndUploadImage, uploadOriginalOnly };

