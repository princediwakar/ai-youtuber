import { youtube_v3 } from 'googleapis'; // 💡 FIX: Removed the unused 'google' import.
import { MasterCurriculum } from './curriculum';
import { QuizJob } from './types';

const MANAGER_TAG_PREFIX = '[managed-by:quiz-app; key:';
const MANAGER_TAG_SUFFIX = ']';

/**
 * Generates a consistent, URL-safe key from multiple identifying parts.
 * @param parts An array of strings to join into a key.
 * @returns A standardized canonical key string.
 */
export function generateCanonicalKey(...parts: string[]): string {
  const sanitize = (str: string) => str.toLowerCase().trim().replace(/[\s&]+/g, '-');
  return parts.map(sanitize).filter(Boolean).join('-');
}

/**
 * Parses the canonical key from a playlist's description tag.
 * @param description The playlist description string.
 * @returns The canonical key if found, otherwise null.
 */
function parseCanonicalKeyFromDescription(description?: string | null): string | null {
  if (!description) return null;
  const startIndex = description.indexOf(MANAGER_TAG_PREFIX);
  if (startIndex === -1) return null;
  const keyStartIndex = startIndex + MANAGER_TAG_PREFIX.length;
  const endIndex = description.indexOf(MANAGER_TAG_SUFFIX, keyStartIndex);
  if (endIndex === -1) return null;
  return description.substring(keyStartIndex, endIndex);
}

/**
 * Fetches all of the channel's playlists and maps them by their canonical key.
 * @param youtube The authenticated YouTube API client.
 * @returns A Map where keys are canonical keys and values are YouTube Playlist IDs.
 */
export async function findManagedPlaylists(youtube: youtube_v3.Youtube): Promise<Map<string, string>> {
  console.log("Fetching and mapping all managed playlists from YouTube...");
  const playlistMap = new Map<string, string>();
  let nextPageToken: string | undefined = undefined;

  try {
    do {
      const response = await youtube.playlists.list({
        part: ['snippet'],
        mine: true,
        maxResults: 50,
        pageToken: nextPageToken,
      });

      if (response.data.items) {
        for (const item of response.data.items) {
          const key = parseCanonicalKeyFromDescription(item.snippet?.description);
          if (key && item.id) {
            playlistMap.set(key, item.id);
          }
        }
      }
      nextPageToken = response.data.nextPageToken || undefined;
    } while (nextPageToken);
    
    console.log(`Found ${playlistMap.size} existing managed playlists.`);
  } catch (error) {
    console.error("Could not fetch YouTube playlists:", error);
    throw new Error("YouTube API request for playlists failed.");
  }
  return playlistMap;
}

/**
 * Gets a playlist ID or creates one, with persona-aware titles and keys.
 * @param youtube The authenticated YouTube API client.
 * @param jobData The full job object from the database.
 * @param playlistMap The pre-fetched map of existing playlists.
 * @returns The YouTube Playlist ID.
 */
export async function getOrCreatePlaylist(
  youtube: youtube_v3.Youtube,
  jobData: QuizJob,
  playlistMap: Map<string, string>
): Promise<string> {
  const { persona, category, data, created_at } = jobData;
  const { topic_display_name, category_display_name, generation_date } = data;

  let canonicalKey: string;
  let playlistTitle: string;
  const personaDisplayName = MasterCurriculum[persona]?.displayName || persona;
  const effectiveDate = generation_date || created_at;

  if (persona === 'current_affairs') {
    const date = new Date(effectiveDate);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    canonicalKey = generateCanonicalKey(persona, category, String(year), month);
    playlistTitle = `▶️ ${category_display_name} - ${month} ${year}`;
  } else {
    canonicalKey = generateCanonicalKey(persona, category, data.question.topic);
    playlistTitle = `▶️ ${personaDisplayName}: ${topic_display_name}`;
  }
    
  if (playlistMap.has(canonicalKey)) {
    return playlistMap.get(canonicalKey)!;
  }

  console.log(`Creating new playlist: "${playlistTitle}" for key "${canonicalKey}"...`);
  
  const tag = `${MANAGER_TAG_PREFIX}${canonicalKey}${MANAGER_TAG_SUFFIX}`;
  const playlistDescription = `A collection of quiz videos on ${topic_display_name || category_display_name} for students of ${personaDisplayName}.\n\n${tag}`;

  try {
    const newPlaylist = await youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
          snippet: { title: playlistTitle, description: playlistDescription },
          status: { privacyStatus: 'public' },
      },
    });

    const newPlaylistId = newPlaylist.data.id;
    if (!newPlaylistId) throw new Error("YouTube API did not return an ID for the new playlist.");
    
    playlistMap.set(canonicalKey, newPlaylistId);
    console.log(`Successfully created playlist with ID: ${newPlaylistId}`);
    return newPlaylistId;
  } catch(error) {
    console.error(`Failed to create playlist "${playlistTitle}":`, error);
    throw new Error(`Failed to create playlist "${playlistTitle}".`);
  }
}