import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Upload an image buffer to Cloudinary
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    format?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resource_type || 'image',
      folder: options.folder || 'quiz-frames',
      public_id: options.public_id,
      format: options.format || 'png',
      ...options,
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type,
          });
        } else {
          reject(new Error('Upload failed: No result returned'));
        }
      }
    ).end(buffer);
  });
}

/**
 * Download an image from Cloudinary URL
 */
export async function downloadImageFromCloudinary(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted image: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete image ${publicId}:`, error);
    throw error;
  }
}

/**
 * Generate multiple frame public IDs for a job
 */
export function generateFramePublicIds(jobId: string, themeName: string, frameCount: number = 3): string[] {
  return Array.from({ length: frameCount }, (_, index) => 
    `quiz-frames/${themeName}-job-${jobId}-frame-${index + 1}`
  );
}

/**
 * Upload a video buffer to Cloudinary
 */
export async function uploadVideoToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    format?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'video' as const,
      folder: options.folder || 'quiz-videos',
      public_id: options.public_id,
      format: options.format || 'mp4',
      ...options,
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary video upload error:', error);
          reject(error);
        } else if (result) {
          resolve({
            public_id: result.public_id,
            secure_url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            resource_type: result.resource_type,
          });
        } else {
          reject(new Error('Video upload failed: No result returned'));
        }
      }
    ).end(buffer);
  });
}

/**
 * Download a video from Cloudinary URL
 */
export async function downloadVideoFromCloudinary(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download video: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate video public ID for a job
 */
export function generateVideoPublicId(jobId: string): string {
  return `quiz-videos/quiz-${jobId}`;
}

/**
 * Cleanup old frames for a job (useful for retries)
 */
export async function cleanupJobFrames(publicIds: string[]): Promise<void> {
  try {
    const deletePromises = publicIds.map(id => 
      cloudinary.uploader.destroy(id).catch(err => 
        console.warn(`Failed to delete ${id}:`, err)
      )
    );
    await Promise.allSettled(deletePromises);
  } catch (error) {
    console.error('Error during frame cleanup:', error);
  }
}

/**
 * Delete a video from Cloudinary
 */
export async function deleteVideoFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
    console.log(`Deleted video: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete video ${publicId}:`, error);
    throw error;
  }
}