import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { getAccountConfig } from './accounts';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

/**
 * Get configured Cloudinary instance for a specific account
 */
async function getCloudinaryForAccount(accountId: string) {
  const accountConfig = await getAccountConfig(accountId);
  
  return {
    config: {
      cloud_name: accountConfig.cloudinaryCloudName,
      api_key: accountConfig.cloudinaryApiKey,
      api_secret: accountConfig.cloudinaryApiSecret,
    },
    uploader: cloudinary.uploader,
  };
}

/**
 * Upload an image buffer to Cloudinary for a specific account
 */
export async function uploadImageToCloudinary(
  buffer: Buffer,
  accountId: string,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    format?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  const { config, uploader } = await getCloudinaryForAccount(accountId);
  
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resource_type || 'image',
      folder: options.folder || `${accountId}/quiz-frames`,
      public_id: options.public_id,
      format: options.format || 'png',
      ...config,
      ...options,
    };

    uploader.upload_stream(
      uploadOptions,
      (error: any, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error(`Cloudinary upload error for account ${accountId}:`, error);
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
 * Download an image from Cloudinary URL (account-agnostic)
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
 * Delete an image from Cloudinary for a specific account
 */
export async function deleteImageFromCloudinary(publicId: string, accountId: string): Promise<void> {
  const { config, uploader } = await getCloudinaryForAccount(accountId);
  
  try {
    // Temporarily configure cloudinary for this account
    cloudinary.config(config);
    await uploader.destroy(publicId);
    console.log(`Deleted image for account ${accountId}: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete image ${publicId} for account ${accountId}:`, error);
    throw error;
  }
}

/**
 * Generate multiple frame public IDs for a job with account-specific folders
 */
export function generateFramePublicIds(
  jobId: string, 
  themeName: string, 
  accountId: string,
  frameCount: number = 3,
  persona?: string,
  layoutType?: string
): string[] {
  return Array.from({ length: frameCount }, (_, index) => {
    const frameNumber = index + 1;
    const frameName = `frame-${frameNumber}`;
    const personaName = persona || 'unknown';
    const layout = layoutType || 'unknown';
    return `${accountId}/quiz-frames/${frameNumber}-${frameName}-${personaName}-${layout}-${themeName}-${jobId}`;
  });
}

/**
 * Upload a video buffer to Cloudinary for a specific account
 */
export async function uploadVideoToCloudinary(
  buffer: Buffer,
  accountId: string,
  options: { 
    resource_type?: "video"; 
    folder?: string; 
    public_id?: string; 
    format?: string; 
  } = {}
): Promise<CloudinaryUploadResult> {
  const { config, uploader } = await getCloudinaryForAccount(accountId);
  
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'video' as const,
      folder: options.folder || `${accountId}/quiz-videos`,
      public_id: options.public_id,
      format: options.format || 'mp4',
      ...config,
      ...options,
    };

    uploader.upload_stream(
      uploadOptions,
      (error: any, result: UploadApiResponse | undefined) => {
        if (error) {
          console.error(`Cloudinary video upload error for account ${accountId}:`, error);
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
 * Download a video from Cloudinary URL (account-agnostic)
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
 * Generate video public ID for a job with account-specific folder
 */
export function generateVideoPublicId(jobId: string, accountId: string, persona?: string, themeName?: string): string {
  const personaName = persona || 'unknown';
  const theme = themeName || 'unknown';
  return `${accountId}/quiz-videos/1-video-${personaName}-quiz-${theme}-${jobId}`;
}

/**
 * Cleanup old frames for a job (useful for retries) - account-aware
 */
export async function cleanupJobFrames(publicIds: string[], accountId: string): Promise<void> {
  const { config, uploader } = await getCloudinaryForAccount(accountId);
  
  try {
    // Temporarily configure cloudinary for this account
    cloudinary.config(config);
    
    const deletePromises = publicIds.map(id => 
      uploader.destroy(id).catch(err => 
        console.warn(`Failed to delete ${id} for account ${accountId}:`, err)
      )
    );
    await Promise.allSettled(deletePromises);
  } catch (error) {
    console.error(`Error during frame cleanup for account ${accountId}:`, error);
  }
}

/**
 * Delete a video from Cloudinary for a specific account
 */
export async function deleteVideoFromCloudinary(publicId: string, accountId: string): Promise<void> {
  const { config, uploader } = await getCloudinaryForAccount(accountId);
  
  try {
    // Temporarily configure cloudinary for this account
    cloudinary.config(config);
    await uploader.destroy(publicId, { resource_type: 'video' });
    console.log(`Deleted video for account ${accountId}: ${publicId}`);
  } catch (error) {
    console.error(`Failed to delete video ${publicId} for account ${accountId}:`, error);
    throw error;
  }
}

// Legacy functions for backward compatibility (default to english_shots account)

/**
 * @deprecated Use uploadImageToCloudinary(buffer, accountId, options) instead
 */
export async function legacyUploadImageToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    public_id?: string;
    resource_type?: 'image' | 'video' | 'raw' | 'auto';
    format?: string;
  } = {}
): Promise<CloudinaryUploadResult> {
  return uploadImageToCloudinary(buffer, 'english_shots', options);
}

/**
 * @deprecated Use uploadVideoToCloudinary(buffer, accountId, options) instead
 */
export async function legacyUploadVideoToCloudinary(
  buffer: Buffer,
  options: { 
    resource_type?: "video"; 
    folder?: string; 
    public_id?: string; 
    format?: string; 
  } = {}
): Promise<CloudinaryUploadResult> {
  return uploadVideoToCloudinary(buffer, 'english_shots', options);
}