import { youtube_v3 } from 'googleapis';
import { promises as fs } from 'fs';
import path from 'path';
import { config } from './config';

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

  if (!response.data.id) {
    throw new Error("YouTube API did not return a video ID.");
  }

  // Upload custom thumbnail if provided
  if (thumbnailUrl) {
    try {
      await uploadThumbnailToYouTube(response.data.id, thumbnailUrl, youtube);
      console.log(`✅ Custom thumbnail uploaded for video ${response.data.id}`);
    } catch (error) {
      console.warn(`⚠️ Failed to upload thumbnail for video ${response.data.id}:`, error);
    }
  }

  return response.data.id;
}

export async function uploadThumbnailToYouTube(videoId: string, thumbnailUrl: string, youtube: youtube_v3.Youtube): Promise<void> {
  const response = await fetch(thumbnailUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch thumbnail from ${thumbnailUrl}: ${response.statusText}`);
  }
  
  const imageBuffer = Buffer.from(await response.arrayBuffer());
  const tempThumbnailPath = path.join(require('os').tmpdir(), `thumbnail-${videoId}-${Date.now()}.png`);
  await fs.writeFile(tempThumbnailPath, imageBuffer);
  
  try {
    await youtube.thumbnails.set({
      videoId: videoId,
      media: {
        body: require('fs').createReadStream(tempThumbnailPath),
        mimeType: 'image/png'
      }
    });
  } finally {
    await fs.unlink(tempThumbnailPath).catch(e => 
      console.warn(`Failed to delete temp thumbnail file ${tempThumbnailPath}:`, e)
    );
  }
}

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
    if (jobId) {
      console.error(`[Job ${jobId}] Failed to add video to playlist:`, error);
    } else {
      console.error('Failed to add video to playlist:', error);
    }
  }
}