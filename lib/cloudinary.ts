// lib/cloudinary.ts

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
  
  const cfg = {
    cloud_name: accountConfig.cloudinaryCloudName,
    api_key: accountConfig.cloudinaryApiKey,
    api_secret: accountConfig.cloudinaryApiSecret,
  } as const;

  // Ensure the global cloudinary client is configured for this account
  // Cloudinary SDK expects global configuration rather than per-call credentials
  cloudinary.config(cfg);

  return {
    config: cfg,
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
  const { uploader } = await getCloudinaryForAccount(accountId);

  const attemptUpload = (): Promise<CloudinaryUploadResult> => new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: options.resource_type || 'image',
      folder: options.folder || `${accountId}/quiz-frames`,
      public_id: options.public_id,
      format: options.format || 'png',
      timeout: 120000, // 2 minutes timeout
      ...options,
    };

    // Set up timeout handler
    const timeoutId = setTimeout(() => {
      reject(new Error('Upload timeout: Request took longer than 2 minutes'));
    }, 120000);

    const stream = uploader.upload_stream(
      uploadOptions,
      (error: any, result: UploadApiResponse | undefined) => {
        clearTimeout(timeoutId);
        if (error) {
          console.error(`Cloudinary upload error for account ${accountId}:`, error?.message || error);
          console.error(error);
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
    );
    stream.end(buffer);
  });

  // Simple retry for transient DNS/network errors
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await attemptUpload();
    } catch (err: any) {
      const isRetryableError = typeof err?.message === 'string' && 
        (/ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout|TimeoutError|Request Timeout/i.test(err.message) || err?.http_code === 499);
      if (attempt < maxRetries && isRetryableError) {
        const backoffMs = 500 * Math.pow(2, attempt);
        console.warn(`Retrying Cloudinary image upload for ${accountId} in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries}) due to: ${err.message}`);
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Upload failed after all retries');
}

/**
 * Download an image from Cloudinary URL (account-agnostic)
 * FIX: Rewritten to use getReader() to avoid async iterator conflicts and 
 * handles the chunk types explicitly to resolve the Buffer/Uint8Array conflict.
 */
export async function downloadImageFromCloudinary(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  
  if (response.body) {
    // CRITICAL: Use getReader() to explicitly handle the stream iteration, 
    // avoiding the Symbol.asyncIterator type conflict.
    const reader = response.body.getReader();
    const chunks: Buffer[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }
      
      // CRITICAL: Ensure the chunk (value) is treated as a Buffer. 
      // This is necessary because in some TS configurations, Uint8Array isn't 
      // fully compatible with Buffer, even though Buffer is a Uint8Array.
      // Casting the value to Uint8Array and wrapping in Buffer.from() 
      // ensures it satisfies the Node.js Buffer type requirement for Buffer.concat.
      chunks.push(Buffer.from(value as Uint8Array)); 
    }
    
    // Buffer.concat safely combines the array of Buffers
    return Buffer.concat(chunks);
  }

  // Fallback if response.body is null
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
  const { uploader } = await getCloudinaryForAccount(accountId);

  const attemptUpload = (): Promise<CloudinaryUploadResult> => new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'video' as const,
      folder: options.folder || `${accountId}/quiz-videos`,
      public_id: options.public_id,
      format: options.format || 'mp4',
      timeout: 180000, // 3 minutes timeout for videos (larger files)
      ...options,
    };

    // Set up timeout handler
    const timeoutId = setTimeout(() => {
      reject(new Error('Video upload timeout: Request took longer than 3 minutes'));
    }, 180000);

    const stream = uploader.upload_stream(
      uploadOptions,
      (error: any, result: UploadApiResponse | undefined) => {
        clearTimeout(timeoutId);
        if (error) {
          console.error(`Cloudinary video upload error for account ${accountId}:`, error?.message || error);
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
    );
    stream.end(buffer);
  });

  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await attemptUpload();
    } catch (err: any) {
      const isRetryableError = typeof err?.message === 'string' && 
        (/ENOTFOUND|ECONNRESET|ETIMEDOUT|timeout|TimeoutError|Request Timeout/i.test(err.message) || err?.http_code === 499);
      if (attempt < maxRetries && isRetryableError) {
        const backoffMs = 500 * Math.pow(2, attempt);
        console.warn(`Retrying Cloudinary video upload for ${accountId} in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries}) due to: ${err.message}`);
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Video upload failed after all retries');
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

/**
 * Cleanup all Cloudinary assets for a completed job
 */
export async function cleanupJobAssets(jobData: any, jobAccountId: string): Promise<void> {
  try {
    const cleanupPromises = [];
    if (jobData.videoUrl) {
      const videoPublicId = extractPublicIdFromUrl(jobData.videoUrl);
      if (videoPublicId) {
        cleanupPromises.push(deleteVideoFromCloudinary(videoPublicId, jobAccountId).catch(err => console.warn(`Failed to delete video ${videoPublicId} for ${jobAccountId}:`, err)));
      }
    }
    if (jobData.frameUrls && Array.isArray(jobData.frameUrls)) {
      jobData.frameUrls.forEach((frameUrl: string) => {
        const framePublicId = extractPublicIdFromUrl(frameUrl);
        if (framePublicId) {
          cleanupPromises.push(deleteImageFromCloudinary(framePublicId, jobAccountId).catch(err => console.warn(`Failed to delete frame ${framePublicId} for ${jobAccountId}:`, err)));
        }
      });
    }
    await Promise.allSettled(cleanupPromises);
    console.log(`🧹 Cleaned up Cloudinary assets for ${jobAccountId} job`);
  } catch (error) {
    console.error(`Error during Cloudinary cleanup for ${jobAccountId}:`, error);
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/v[0-9]+\/(.+?)(?:\.[\w]+)?$/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.warn(`Failed to extract public_id from URL: ${url}`, error);
    return null;
  }
}