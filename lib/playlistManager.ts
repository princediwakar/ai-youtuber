import { youtube_v3 } from 'googleapis';
import { MasterPersonas } from './personas';
import { QuizJob } from './types';
import { getAccountConfig, getAccountForPersona } from './accounts';

const MANAGER_TAG_PREFIX = '[managed-by:quiz-app; key:';
const MANAGER_TAG_SUFFIX = ']';

// In-memory lock to prevent duplicate playlist creation
const playlistCreationLocks = new Map<string, Promise<string>>();

/**
 * Generates a consistent, URL-safe key from multiple identifying parts.
 */
export function generateCanonicalKey(...parts: string[]): string {
  const sanitize = (str: string) => str.toLowerCase().trim().replace(/[\s&]+/g, '-');
  return parts.map(sanitize).filter(Boolean).join('-');
}

/**
 * Generates relevant hashtags based on account and persona.
 */
function generateHashtags(accountId: string, persona: string, topicDisplayName: string): string {
  const account = getAccountConfig(accountId);
  
  const hashtagMap: Record<string, Record<string, string[]>> = {
    english_shots: {
      english_vocab_builder: ['#LearnEnglish', '#EnglishVocabulary', '#Vocabulary', '#EnglishQuiz', '#ESL']
    },
    health_shots: {
      brain_health_tips: ['#BrainHealth', '#Memory', '#Focus', '#CognitiveHealth', '#Wellness'],
      eye_health_tips: ['#EyeHealth', '#VisionCare', '#ScreenTime', '#EyeCare', '#HealthyEyes']
    }
  };

  const accountHashtags = hashtagMap[accountId] || {};
  const personalizedHashtags = accountHashtags[persona] || ['#Health', '#Tips', '#Wellness'];
  
  // Add topic-specific hashtags
  const topicKey = topicDisplayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  if (topicKey.length > 2) {
    personalizedHashtags.push(`#${topicKey}`);
  }

  return personalizedHashtags.slice(0, 5).join(' ');
}

/**
 * Generates account-specific playlist titles.
 */
function generatePlaylistTitle(accountId: string, persona: string, topicDisplayName: string): string {
  const titleTemplates: Record<string, Record<string, string>> = {
    english_shots: {
      english_vocab_builder: `English Vocabulary: ${topicDisplayName} | Daily Quizzes`
    },
    health_shots: {
      brain_health_tips: `Brain Health: ${topicDisplayName} | Expert Tips`,
      eye_health_tips: `Eye Health: ${topicDisplayName} | Vision Care Tips`
    }
  };

  const accountTemplates = titleTemplates[accountId] || {};
  return accountTemplates[persona] || `${topicDisplayName} | Educational Content`;
}

/**
 * Generates SEO-optimized keywords based on account focus.
 */
function generateSEOKeywords(accountId: string, persona: string, topicDisplayName: string): string {
  const keywordMap: Record<string, Record<string, string[]>> = {
    english_shots: {
      english_vocab_builder: ['learn english', 'english vocabulary', 'english quiz', 'ESL lessons', 'IELTS vocabulary', 'TOEFL words', 'speak english fluently']
    },
    health_shots: {
      brain_health_tips: ['brain health', 'memory improvement', 'cognitive function', 'mental wellness', 'focus techniques', 'brain exercises'],
      eye_health_tips: ['eye health', 'vision care', 'screen time protection', 'eye exercises', 'digital eye strain', 'eye safety']
    }
  };

  const accountKeywords = keywordMap[accountId] || {};
  const baseKeywords = accountKeywords[persona] || ['health tips', 'wellness', 'educational content'];
  const topicKeyword = topicDisplayName.toLowerCase();
  
  return [...baseKeywords, topicKeyword].slice(0, 8).join(', ');
}

/**
 * Generates account-specific playlist descriptions.
 */
function generatePlaylistDescription(accountId: string, persona: string, topicDisplayName: string, canonicalKey: string): string {
  const account = getAccountConfig(accountId);
  const seoKeywords = generateSEOKeywords(accountId, persona, topicDisplayName);
  const hashtags = generateHashtags(accountId, persona, topicDisplayName);
  const tag = `${MANAGER_TAG_PREFIX}${canonicalKey}${MANAGER_TAG_SUFFIX}`;

  if (accountId === 'english_shots') {
    return `🚀 Master ${topicDisplayName} to speak English fluently! This is your ultimate collection of daily vocabulary quizzes.

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
  }

  if (accountId === 'health_shots') {
    if (persona === 'brain_health_tips') {
      return `🧠 Boost your brain health with expert tips on ${topicDisplayName}! Science-backed advice for better memory, focus, and cognitive wellness.

✅ What you'll learn:
• Evidence-based brain health strategies
• Memory enhancement techniques
• Focus and concentration methods
• Cognitive exercises and training
• Brain-healthy lifestyle habits

🎯 Why trust our content?
• Created by certified health professionals
• Based on latest neuroscience research
• Practical tips you can use immediately
• Suitable for all ages and fitness levels

💡 Your brain health journey: Watch → Apply → Track progress → Feel the difference!
🔔 New brain health tips uploaded regularly!

🏆 Join thousands improving their cognitive wellness with us!

Keywords: ${seoKeywords}
${hashtags}

${tag}`;
    }

    if (persona === 'eye_health_tips') {
      return `👁️ Protect and improve your vision with expert eye health tips on ${topicDisplayName}! Professional advice for healthy eyes in the digital age.

✅ What you'll discover:
• Screen time protection strategies
• Eye exercises for better vision
• Digital eye strain prevention
• Vision-supporting nutrition tips
• Daily eye care routines

🎯 Why choose our eye care advice?
• Created by certified optometrists
• Evidence-based prevention methods
• Perfect for screen users and professionals
• Easy-to-follow daily practices

💡 Your vision care plan: Watch → Practice → Protect → Maintain healthy eyes!
🔔 New eye health tips uploaded weekly!

🏆 Join thousands protecting their vision with us!

Keywords: ${seoKeywords}
${hashtags}

${tag}`;
    }
  }

  // Fallback description
  return `📚 Expert content on ${topicDisplayName} from ${account.name}. 

Educational content designed for ${account.branding.audience} with a ${account.branding.tone} approach.

Keywords: ${seoKeywords}
${hashtags}

${tag}`;
}

/**
 * Parses the canonical key from a playlist's description tag.
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
 * Fetches all managed playlists for the authenticated account.
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
 * Gets a playlist ID or creates one with account-specific branding.
 */
export async function getOrCreatePlaylist(
  youtube: youtube_v3.Youtube,
  jobData: QuizJob,
  playlistMap: Map<string, string>
): Promise<string> {
  const { persona, topic, data } = jobData;
  
  // Determine account from persona
  const account = getAccountForPersona(persona);
  const accountId = account.id;
  
  const topic_display_name = jobData.topic_display_name || data.topic_display_name;
  let canonicalKey: string;
  let playlistTitle: string;

  const personaData = MasterPersonas[persona];
  let topicDisplayName = topic_display_name;

  // Get proper topic display name
  const topicKey = (data.content as any)?.topic || (data.question as any)?.topic || topic;
  topicDisplayName = personaData?.subCategories?.find(cat => cat.key === topicKey)?.displayName || topic_display_name;
  
  // Generate account-specific canonical key and title
  canonicalKey = generateCanonicalKey(accountId, persona, topicKey);
  playlistTitle = generatePlaylistTitle(accountId, persona, topicDisplayName);
    
  if (playlistMap.has(canonicalKey)) {
    return playlistMap.get(canonicalKey)!;
  }

  if (playlistCreationLocks.has(canonicalKey)) {
    console.log(`Waiting for existing playlist creation for key "${canonicalKey}"...`);
    return await playlistCreationLocks.get(canonicalKey)!;
  }

  console.log(`Creating new ${account.name} playlist: "${playlistTitle}" for key "${canonicalKey}"...`);
  
  const playlistDescription = generatePlaylistDescription(accountId, persona, topicDisplayName, canonicalKey);

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