import { youtube_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { config } from './config';

/**
 * Uploads a video file to YouTube and optionally sets a custom thumbnail.
 */
export async function uploadToYouTube(videoPath: string, metadata: any, youtube: youtube_v3.Youtube, thumbnailUrl?: string): Promise<string> {
  const response = await youtube.videos.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: {
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags,
        categoryId: config.YOUTUBE_CATEGORY_ID,
      },
      status: { privacyStatus: 'public', selfDeclaredMadeForKids: false },
    },
    media: { body: require('fs').createReadStream(videoPath) },
  });

  const videoId = response.data.id;
  if (!videoId) {
    throw new Error("YouTube API did not return a video ID.");
  }

  // --- FIX: Attempt to upload the custom thumbnail ---
  // This now calls the corrected uploadThumbnailToYouTube function.
  if (thumbnailUrl) {
    try {
      console.log(`Attempting to upload custom thumbnail for video ${videoId}...`);
      await uploadThumbnailToYouTube(videoId, thumbnailUrl, youtube);
      console.log(`✅ Successfully uploaded custom thumbnail for video ${videoId}.`);
    } catch (error) {
      // This catch block handles the expected permission errors gracefully.
      console.warn(`ℹ️ Skipping custom thumbnail for video ${videoId}. Reason:`, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  return videoId;
}

/**
 * Downloads a thumbnail image and uploads it to a specific YouTube video.
 */
export async function uploadThumbnailToYouTube(videoId: string, thumbnailUrl: string, youtube: youtube_v3.Youtube): Promise<void> {
  const response = await fetch(thumbnailUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch thumbnail from ${thumbnailUrl}: ${response.statusText}`);
  }
  
  const imageArrayBuffer = await response.arrayBuffer();
  // --- FIX: Convert the generic ArrayBuffer to a Buffer, then to a Uint8Array for fs.writeFile ---
  const imageBuffer = Buffer.from(imageArrayBuffer);
  const tempThumbnailPath = path.join(tmpdir(), `thumbnail-${videoId}-${Date.now()}.png`);
  await fs.writeFile(tempThumbnailPath, new Uint8Array(imageBuffer));
  
  try {
    await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        body: require('fs').createReadStream(tempThumbnailPath),
        mimeType: 'image/png'
      }
    });
  } finally {
    // Clean up the temporary file
    await fs.unlink(tempThumbnailPath).catch(e => 
      console.warn(`Failed to delete temp thumbnail file ${tempThumbnailPath}:`, e)
    );
  }
}

/**
 * Adds a given video to a specific YouTube playlist.
 */
export async function addVideoToPlaylist(
  videoId: string,
  playlistId: string,
  youtube: youtube_v3.Youtube,
  jobId?: string
): Promise<void> {
  try {
    await youtube.playlistItems.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: { kind: 'youtube#video', videoId: videoId },
        },
      },
    });
    if (jobId) {
      console.log(`[Job ${jobId}] Added video to playlist ${playlistId}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    // Gracefully handle playlist errors (e.g., quota limits) without failing the whole job
    if (jobId) {
      console.warn(`[Job ${jobId}] Could not add video to playlist: ${message}`);
    } else {
      console.warn(`Could not add video to playlist: ${message}`);
    }
  }
}
