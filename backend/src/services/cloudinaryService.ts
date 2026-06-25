/**
 * Cloudinary Service
 * Handles all image uploads to Cloudinary cloud storage.
 *
 * Cloud: duauqfclh
 * Replaces local multer disk storage — files are stored in Cloudinary,
 * not on the server filesystem.
 */

import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Readable } from 'stream';

// Configure Cloudinary with credentials from .env (required — no hardcoded fallbacks)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/** Upload folders in Cloudinary */
export const FOLDERS = {
  logos:    'gst_billing/logos',
  items:    'gst_billing/items',
  profiles: 'gst_billing/profiles',
  invoices: 'gst_billing/invoices',
  expenses: 'gst_billing/receipts',
} as const;

export type CloudinaryFolder = typeof FOLDERS[keyof typeof FOLDERS];

/**
 * Upload a buffer to Cloudinary.
 * @param buffer   - Raw file buffer (from multer memoryStorage)
 * @param folder   - Cloudinary folder (use FOLDERS constants)
 * @param publicId - Optional custom public ID (filename)
 * @returns Cloudinary upload result with secure_url, public_id, width, height, etc.
 */
export function uploadToCloudinary(
  buffer: Buffer,
  folder: CloudinaryFolder,
  publicId?: string,
): Promise<any> {
  return new Promise((resolve, reject) => {
    const options: any = {
      folder,
      resource_type: 'image',
      transformation: [
        { quality: 'auto', fetch_format: 'auto' }, // Auto-optimize format & quality
      ],
    };
    if (publicId) options.public_id = publicId;

    const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error);
      resolve(result);
    });

    // Pipe the buffer into the upload stream
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete an image from Cloudinary by its public ID.
 * Use this when updating or deleting a record that has an image.
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    // Non-fatal — log and continue
  }
}

/**
 * Extract Cloudinary public_id from a secure_url.
 * e.g. "https://res.cloudinary.com/duauqfclh/image/upload/v123/gst_billing/logos/logo-abc.jpg"
 *   → "gst_billing/logos/logo-abc"
 */
export function extractPublicId(secureUrl: string): string | null {
  try {
    const match = secureUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-z]+)?$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Multer instance using memory storage.
 * Files are held in RAM as buffers, then streamed to Cloudinary.
 * Supports: jpeg, jpg, png, gif, webp
 * Max size: 10 MB
 */
export const cloudinaryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext  = allowed.test(file.originalname.toLowerCase().split('.').pop() || '');
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  },
});

export { cloudinary };
