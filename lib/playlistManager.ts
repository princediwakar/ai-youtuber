//playlistManager.ts

import { youtube_v3 } from 'googleapis';
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

// --- MODIFICATION START ---
// The following four functions have been updated for the English Vocabulary persona.

/**
 * Generates relevant hashtags for English learning topics.
 * @param persona The educational persona (e.g., english_vocab_builder)
 * @param topicDisplayName The display name of the topic
 * @returns Formatted hashtag string
 */
function generateHashtags(persona: string, topicDisplayName: string): string {
  const baseHashtags: Record<string, string[]> = {
    english_vocab_builder: ['#LearnEnglish', '#EnglishVocabulary', '#Vocabulary', '#EnglishQuiz', '#ESL'],
  };

  const personalizedHashtags = baseHashtags[persona] || ['#Education', '#Quiz', '#Learning'];
  
  // Add topic-specific hashtags
  const topicKey = topicDisplayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  if (topicKey.length > 2) {
    personalizedHashtags.push(`#${topicKey}`);
  }

  return personalizedHashtags.slice(0, 5).join(' ');
}

/**
 * Generates clean, engaging playlist titles for English learners.
 * @param persona The educational persona
 * @param topicDisplayName The topic display name
 * @returns Clean playlist title in format: "English Vocabulary: Topic | Daily Quizzes"
 */
function generatePlaylistTitle(persona: string, topicDisplayName: string): string {
  const titleTemplates: Record<string, string> = {
    english_vocab_builder: `English Vocabulary: ${topicDisplayName} | Daily Quizzes`,
  };

  return titleTemplates[persona] || `English Learning: ${topicDisplayName} Quizzes`;
}

/**
 * Generates SEO-optimized keywords for playlist descriptions.
 * @param persona The educational persona
 * @param topicDisplayName The topic display name
 * @returns Comma-separated keywords for better searchability
 */
function generateSEOKeywords(persona: string, topicDisplayName: string): string {
  const keywordMap: Record<string, string[]> = {
    english_vocab_builder: ['learn english', 'english vocabulary', 'english quiz', 'ESL lessons', 'IELTS vocabulary', 'TOEFL words', 'speak english fluently'],
  };

  const baseKeywords = keywordMap[persona] || ['language learning', 'educational quiz', 'study english'];
  const topicKeyword = topicDisplayName.toLowerCase();
  
  return [...baseKeywords, topicKeyword, 'daily english practice', 'vocabulary builder'].slice(0, 8).join(', ');
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
  const topic_display_name = jobData.topic_display_name || data.topic_display_name;
  let canonicalKey: string;
  let playlistTitle: string;

  const personaData = MasterPersonas[persona];
  let topicDisplayName = topic_display_name;

  const topicKey = data.question?.topic || topic;
  topicDisplayName = personaData?.subCategories?.find(cat => cat.key === topicKey)?.displayName || topic_display_name;
  
  canonicalKey = generateCanonicalKey(persona, topicKey);
  playlistTitle = generatePlaylistTitle(persona, topicDisplayName);
    
  if (playlistMap.has(canonicalKey)) {
    return playlistMap.get(canonicalKey)!;
  }

  if (playlistCreationLocks.has(canonicalKey)) {
    console.log(`Waiting for existing playlist creation for key "${canonicalKey}"...`);
    return await playlistCreationLocks.get(canonicalKey)!;
  }

  console.log(`Creating new playlist: "${playlistTitle}" for key "${canonicalKey}"...`);
  
  const tag = `${MANAGER_TAG_PREFIX}${canonicalKey}${MANAGER_TAG_SUFFIX}`;
  
  const seoKeywords = generateSEOKeywords(persona, topicDisplayName);
  const hashtags = generateHashtags(persona, topicDisplayName);
  
  // This description block is now fully tailored to English learners.
  const playlistDescription = `🚀 Master ${topicDisplayName} to speak English fluently! This is your ultimate collection of daily vocabulary quizzes.

✅ What you'll get:
• 100+ high-frequency words with explanations
• Quizzes on Synonyms, Antonyms, Idioms, Phrasal Verbs, and more
• Clear examples to help you use words correctly
• Quick 30-second revision videos

🎯 Why choose this playlist?
• Perfect for all levels (Beginner to Advanced)
• Helps you prepare for exams like IELTS, TOEFL, and TOEIC
• Created by English language experts
• Proven to expand your vocabulary and boost confidence

💡 Study Plan: Watch daily → Comment your answer → Learn → Speak with confidence!
🔔 New videos uploaded every day!

🏆 Join thousands of learners who are improving their English with us!

Keywords: ${seoKeywords}
${hashtags}

${tag}`;

  const creationPromise = createPlaylistWithLock(youtube, playlistTitle, playlistDescription, canonicalKey, playlistMap);
  playlistCreationLocks.set(canonicalKey, creationPromise);
  
  try {
    const playlistId = await creationPromise;
    return playlistId;
  } finally {
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
    if (!newPlaylistId) throw new Error("YouTube API did not return an ID for the new playlist.")
    
    playlistMap.set(canonicalKey, newPlaylistId);
    console.log(`Successfully created playlist with ID: ${newPlaylistId}`);
    return newPlaylistId;
  } catch(error) {
    console.error(`Failed to create playlist "${playlistTitle}":`, error);
    throw new Error(`Failed to create playlist "${playlistTitle}".`);
  }
}

// --- MODIFICATION END ---