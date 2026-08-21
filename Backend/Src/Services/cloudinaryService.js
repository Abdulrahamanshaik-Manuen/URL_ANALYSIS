import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dcsfxv6g1',
  api_key: process.env.CLOUDINARY_API_KEY || '496164664383837',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'whOSplbO-RsrQ-Tau3_DakfnIsY'
});

/**
 * Uploads base64 image data to Cloudinary CDN
 * @param {string} base64Data Base64 screenshot image string
 * @param {string} folder Target Cloudinary folder
 * @returns {Promise<string|null>} Permanent Cloudinary HTTPS CDN URL or null
 */
export async function uploadScreenshotToCloudinary(base64Data, folder = 'url_analysis_screenshots') {
  if (!base64Data || typeof base64Data !== 'string') return null;

  try {
    const formattedData = base64Data.startsWith('data:image')
      ? base64Data
      : `data:image/jpeg;base64,${base64Data}`;

    const res = await cloudinary.uploader.upload(formattedData, {
      folder: folder,
      resource_type: 'image',
      format: 'jpg',
      transformation: [{ width: 1280, crop: 'limit', quality: 'auto:good' }]
    });

    return res.secure_url || res.url;
  } catch (err) {
    console.error('Cloudinary screenshot upload error:', err.message);
    return null;
  }
}

export default cloudinary;
