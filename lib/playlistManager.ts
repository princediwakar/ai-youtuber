import { youtube_v3 } from 'googleapis'; // 💡 FIX: Removed the unused 'google' import.
import { MasterPersonas } from './personas';
import { QuizJob } from './types';

const MANAGER_TAG_PREFIX = '[managed-by:quiz-app; key:';
const MANAGER_TAG_SUFFIX = ']';

// In-memory lock to prevent duplicate playlist creation
const playlistCreationLocks = new Map<string, Promise<string>>();

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
 * Generates viral hashtags based on persona and topic for better discoverability
 * @param persona The educational persona (neet_physics, neet_chemistry, etc.)
 * @param topicDisplayName The display name of the topic
 * @returns Formatted hashtag string
 */
function generateHashtags(persona: string, topicDisplayName: string): string {
  const baseHashtags: Record<string, string[]> = {
    neet_physics: ['#NEET', '#NEETPhysics', '#Physics', '#NEETPrep', '#MedicalEntrance', '#PhysicsQuiz'],
    neet_chemistry: ['#NEET', '#NEETChemistry', '#Chemistry', '#NEETPrep', '#MedicalEntrance', '#ChemistryQuiz'],
    neet_biology: ['#NEET', '#NEETBiology', '#Biology', '#NEETPrep', '#MedicalEntrance', '#BiologyQuiz']
  };

  const personalizedHashtags = baseHashtags[persona] || ['#NEET', '#Education', '#Quiz', '#StudyTips', '#ExamPrep', '#Learning'];
  
  // Add topic-specific hashtags
  const topicKey = topicDisplayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  if (topicKey.length > 2) {
    personalizedHashtags.push(`#${topicKey}`);
  }

  return personalizedHashtags.slice(0, 4).join(' ');
}

/**
 * Generates clean, teacher-like playlist titles using exact NEET format
 * @param persona The educational persona
 * @param topicDisplayName The topic display name
 * @returns Clean playlist title in format: "NEET Physics: Topic MCQs | NEET YYYY"
 */
function generatePlaylistTitle(persona: string, topicDisplayName: string): string {
  // Calculate target NEET year based on current date
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-based (0 = January, 4 = May)
  
  // If before May (month 4), use current year. If May or later, use next year
  const neetYear = currentMonth < 4 ? currentYear : currentYear + 1;
  
  const titleTemplates: Record<string, string> = {
    neet_physics: `NEET Physics: ${topicDisplayName} MCQs | NEET ${neetYear}`,
    neet_chemistry: `NEET Chemistry: ${topicDisplayName} MCQs | NEET ${neetYear}`, 
    neet_biology: `NEET Biology: ${topicDisplayName} MCQs | NEET ${neetYear}`
  };

  return titleTemplates[persona] || `NEET: ${topicDisplayName} MCQs | NEET ${neetYear}`;
}

/**
 * Generates SEO-optimized keywords for playlist descriptions
 * @param persona The educational persona
 * @param topicDisplayName The topic display name
 * @returns Comma-separated keywords for better searchability
 */
function generateSEOKeywords(persona: string, topicDisplayName: string): string {
  const keywordMap: Record<string, string[]> = {
    neet_physics: ['NEET physics', 'medical entrance exam', 'physics MCQ questions', 'NEET 2026 preparation', 'physics concepts for NEET'],
    neet_chemistry: ['NEET chemistry', 'medical entrance exam', 'chemistry MCQ questions', 'NEET 2026 preparation', 'chemistry concepts for NEET'],
    neet_biology: ['NEET biology', 'medical entrance exam', 'biology MCQ questions', 'NEET 2026 preparation', 'biology concepts for NEET']
  };

  const baseKeywords = keywordMap[persona] || ['NEET preparation', 'medical entrance exam', 'quiz questions', 'concept clarity', 'exam strategy'];
  const topicKeyword = topicDisplayName.toLowerCase();
  
  return [...baseKeywords, topicKeyword, 'chapter wise practice', 'previous year questions'].slice(0, 8).join(', ');
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
  const { persona, topic, data } = jobData;
  // Use display names from job properties first, then fallback to data properties  
  const topic_display_name = jobData.topic_display_name || data.topic_display_name;

  let canonicalKey: string;
  let playlistTitle: string;

  // Get the topic information from persona config  
  const personaData = MasterPersonas[persona];
  let topicDisplayName = topic_display_name;

  // Get topic from question data (this contains the actual topic)
  const topicKey = data.question?.topic || topic;
  
  // Use topic level for chapter-wise organization (how NEET teachers structure content)
  topicDisplayName = personaData?.subCategories?.find(cat => cat.key === topicKey)?.displayName || topic_display_name;
  
  
  canonicalKey = generateCanonicalKey(persona, topicKey);
  
  // Generate teacher-style chapter playlist titles
  playlistTitle = generatePlaylistTitle(persona, topicDisplayName);
    
  if (playlistMap.has(canonicalKey)) {
    return playlistMap.get(canonicalKey)!;
  }

  // Check if playlist creation is already in progress for this key
  if (playlistCreationLocks.has(canonicalKey)) {
    console.log(`Waiting for existing playlist creation for key "${canonicalKey}"...`);
    return await playlistCreationLocks.get(canonicalKey)!;
  }

  console.log(`Creating new playlist: "${playlistTitle}" for key "${canonicalKey}"...`);
  
  const tag = `${MANAGER_TAG_PREFIX}${canonicalKey}${MANAGER_TAG_SUFFIX}`;
  
  // Generate enhanced description with SEO keywords and hashtags
  const seoKeywords = generateSEOKeywords(persona, topicDisplayName);
  const hashtags = generateHashtags(persona, topicDisplayName);
  const playlistDescription = `🚀 Master ${topicDisplayName} for NEET 2026! The most comprehensive MCQ collection to ace your medical entrance exam.

✅ What you'll get:
• 100+ High-yield MCQs with explanations
• NEET previous year questions (2019-2024)
• Chapter-wise concept builders
• Quick 30-second revision videos
• Exam strategy tips from toppers

🎯 Why choose this playlist?
• Based on latest NEET pattern
• Created by expert ${personaData?.displayName || persona} faculty
• Covers 100% NCERT syllabus
• Proven to boost scores by 40+ marks

💡 Study Plan: Watch daily → Practice → Track progress → Ace NEET!
🔔 New videos uploaded daily at optimal study times

🏆 Join 50,000+ NEET aspirants who trust our content!

Keywords: ${seoKeywords}
${hashtags}

${tag}`;

  // Create a promise for this playlist creation and store it in the lock
  const creationPromise = createPlaylistWithLock(youtube, playlistTitle, playlistDescription, canonicalKey, playlistMap);
  playlistCreationLocks.set(canonicalKey, creationPromise);
  
  try {
    const playlistId = await creationPromise;
    return playlistId;
  } finally {
    // Clean up the lock after creation is complete
    playlistCreationLocks.delete(canonicalKey);
  }
}

/**
 * Internal function to handle the actual playlist creation
 */
async function createPlaylistWithLock(
  youtube: youtube_v3.Youtube,
  playlistTitle: string,
  playlistDescription: string,
  canonicalKey: string,
  playlistMap: Map<string, string>
): Promise<string> {
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