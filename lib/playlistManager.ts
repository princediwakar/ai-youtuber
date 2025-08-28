import { google, youtube_v3 } from 'googleapis';

// A unique string to identify playlists managed by this system.
const MANAGER_TAG_PREFIX = '[managed-by:quiz-app; key:';
const MANAGER_TAG_SUFFIX = ']';

/**
 * Generates a consistent, URL-safe key from a persona and category.
 * Example: ("Interviewer", "Common Mistakes") -> "interviewer-common-mistakes"
 * @param persona - The video's persona.
 * @param category - The video's category.
 * @returns A standardized canonical key.
 */
export function generateCanonicalKey(persona: string, category: string): string {
  const sanitize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, '-');
  return `${sanitize(persona)}-${sanitize(category)}`;
}

/**
 * Parses the description of a YouTube playlist to find our managed tag.
 * @param description - The playlist description string.
 * @returns The canonical key if found, otherwise null.
 */
function parseCanonicalKeyFromDescription(description: string | null | undefined): string | null {
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
 * This is the core function that finds all playlists managed by our system.
 * @param youtube - The authenticated YouTube API client.
 * @returns A Map where keys are canonical keys and values are YouTube Playlist IDs.
 */
export async function findManagedPlaylists(youtube: youtube_v3.Youtube): Promise<Map<string, string>> {
  console.log("Fetching and mapping all managed playlists from YouTube...");
  const playlistMap = new Map<string, string>();
  let nextPageToken: string | undefined = undefined;

  do {
    const response: any = await youtube.playlists.list({
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
    nextPageToken = response.data.nextPageToken;
  } while (nextPageToken);
  
  console.log(`Found ${playlistMap.size} existing managed playlists.`);
  return playlistMap;
}


/**
 * Gets the ID of an existing playlist or creates a new one if it doesn't exist.
 * @param youtube - The authenticated YouTube API client.
 * @param persona - The video's persona.
 * @param category - The video's category.
 * @param playlistMap - The pre-fetched map of existing playlists.
 * @returns The YouTube Playlist ID.
 */
export async function getOrCreatePlaylist(
  youtube: youtube_v3.Youtube,
  persona: string,
  category: string,
  playlistMap: Map<string, string>
): Promise<string> {
  const canonicalKey = generateCanonicalKey(persona, category);
  
  // 1. Check if the playlist already exists in our map
  if (playlistMap.has(canonicalKey)) {
    const playlistId = playlistMap.get(canonicalKey)!;
    console.log(`Found existing playlist for key "${canonicalKey}" with ID: ${playlistId}`);
    return playlistId;
  }

  // 2. If not, create a new one
  console.log(`No playlist found for key "${canonicalKey}". Creating a new one...`);
  const prettyPersona = persona.charAt(0).toUpperCase() + persona.slice(1);
  const playlistTitle = `📚 ${prettyPersona} Quizzes (${category})`;
  
  const tag = `${MANAGER_TAG_PREFIX}${canonicalKey}${MANAGER_TAG_SUFFIX}`;
  const playlistDescription = `A collection of short quiz videos for ${persona} in the ${category} category.\n\n${tag}`;

  const newPlaylist = await youtube.playlists.insert({
    part: ['snippet', 'status'],
    requestBody: {
      snippet: { title: playlistTitle, description: playlistDescription },
      status: { privacyStatus: 'public' },
    },
  });

  const newPlaylistId = newPlaylist.data.id;
  if (!newPlaylistId) {
    throw new Error("YouTube API failed to return an ID for the new playlist.");
  }

  // 3. Update the map with the newly created playlist to avoid re-creating it in the same batch
  playlistMap.set(canonicalKey, newPlaylistId);
  console.log(`Created new playlist "${playlistTitle}" with ID: ${newPlaylistId}`);
  
  return newPlaylistId;
}