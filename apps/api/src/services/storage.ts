import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary with 12-Factor environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
  secure: true,
});

/**
 * Uploads a citizen flood photo (base64 string or file URI) directly to Cloudinary
 */
export async function uploadCitizenReportPhoto(
  base64OrUri: string,
  reportId: string
): Promise<{ success: boolean; url: string; publicId?: string }> {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
      console.warn('⚠️ Cloudinary credentials missing. Using local fallback URI.');
      return { success: true, url: base64OrUri };
    }

    const uploadResponse = await cloudinary.uploader.upload(base64OrUri, {
      folder: 'cebufloodwatch/citizen_reports',
      public_id: `report_${reportId}_${Date.now()}`,
      resource_type: 'image',
      transformation: [
        { width: 1280, height: 1280, crop: 'limit', quality: 'auto', fetch_format: 'auto' },
      ],
    });

    console.log(`📸 [Cloudinary Upload] Photo stored securely: ${uploadResponse.secure_url}`);
    return {
      success: true,
      url: uploadResponse.secure_url,
      publicId: uploadResponse.public_id,
    };
  } catch (error: any) {
    console.error('❌ Cloudinary upload failed:', error.message);
    return {
      success: false,
      url: base64OrUri,
    };
  }
}
