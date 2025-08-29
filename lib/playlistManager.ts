import { youtube_v3 } from 'googleapis'; // 💡 FIX: Removed the unused 'google' import.
import { MasterPersonas } from './personas';
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
 * Generates viral hashtags based on persona and category for better discoverability
 * @param persona The educational persona (neet_physics, neet_chemistry, etc.)
 * @param categoryDisplayName The display name of the category
 * @returns Formatted hashtag string
 */
function generateViralHashtags(persona: string, categoryDisplayName: string): string {
  const baseHashtags: Record<string, string[]> = {
    neet_physics: ['#NEET', '#NEETPhysics', '#Physics', '#NEETPrep', '#MedicalEntrance', '#PhysicsQuiz'],
    neet_chemistry: ['#NEET', '#NEETChemistry', '#Chemistry', '#NEETPrep', '#MedicalEntrance', '#ChemistryQuiz'],
    neet_biology: ['#NEET', '#NEETBiology', '#Biology', '#NEETPrep', '#MedicalEntrance', '#BiologyQuiz'],
    jee_maths: ['#JEE', '#JEEMaths', '#Mathematics', '#JEEPrep', '#Engineering', '#MathsQuiz'],
    jee_physics: ['#JEE', '#JEEPhysics', '#Physics', '#JEEPrep', '#Engineering', '#PhysicsQuiz'],
    jee_chemistry: ['#JEE', '#JEEChemistry', '#Chemistry', '#JEEPrep', '#Engineering', '#ChemistryQuiz'],
    class_10_maths: ['#Class10', '#CBSE', '#Mathematics', '#BoardExam', '#StudyTips', '#MathsQuiz'],
    class_11_physics: ['#Class11', '#CBSE', '#Physics', '#BoardExam', '#StudyTips', '#PhysicsQuiz'],
    class_12_biology: ['#Class12', '#CBSE', '#Biology', '#BoardExam', '#StudyTips', '#BiologyQuiz'],
    ssc_gk: ['#SSC', '#GeneralKnowledge', '#CompetitiveExam', '#GK', '#CurrentAffairs', '#Quiz'],
    upsc_history: ['#UPSC', '#History', '#CivilServices', '#IAS', '#CompetitiveExam', '#StudyMaterial'],
    current_affairs: ['#CurrentAffairs', '#News', '#CompetitiveExam', '#GeneralKnowledge', '#Updates', '#ExamPrep']
  };

  const personalizedHashtags = baseHashtags[persona] || ['#Education', '#Quiz', '#StudyTips', '#ExamPrep', '#Learning', '#Knowledge'];
  
  // Add category-specific hashtags
  const categoryKey = categoryDisplayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  if (categoryKey.length > 2) {
    personalizedHashtags.push(`#${categoryKey}`);
  }

  return personalizedHashtags.slice(0, 4).join(' ');
}

/**
 * Generates SEO-optimized keywords for playlist descriptions
 * @param persona The educational persona
 * @param categoryDisplayName The category display name
 * @returns Comma-separated keywords for better searchability
 */
function generateSEOKeywords(persona: string, categoryDisplayName: string): string {
  const keywordMap: Record<string, string[]> = {
    neet_physics: ['NEET physics', 'medical entrance', 'physics MCQ', 'NEET preparation', 'physics concepts'],
    neet_chemistry: ['NEET chemistry', 'medical entrance', 'chemistry MCQ', 'NEET preparation', 'chemistry concepts'],
    neet_biology: ['NEET biology', 'medical entrance', 'biology MCQ', 'NEET preparation', 'biology concepts'],
    class_10_maths: ['class 10 maths', 'CBSE board', 'mathematics MCQ', '10th grade', 'board exam'],
    class_11_physics: ['class 11 physics', 'CBSE board', 'physics MCQ', '11th grade', 'board exam'],
    class_12_biology: ['class 12 biology', 'CBSE board', 'biology MCQ', '12th grade', 'board exam'],
    
  };

  const baseKeywords = keywordMap[persona] || ['education', 'quiz', 'study material', 'exam preparation', 'learning'];
  const categoryKeyword = categoryDisplayName.toLowerCase();
  
  return [...baseKeywords, categoryKeyword, 'online learning', 'free education'].slice(0, 8).join(', ');
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
  // Use display names from job properties first, then fallback to data properties
  const category_display_name = jobData.category_display_name || data.category_display_name;
  const generation_date = data.generation_date;

  let canonicalKey: string;
  let playlistTitle: string;
  const personaDisplayName = MasterPersonas[persona]?.displayName || persona;
  const effectiveDate = generation_date || created_at;

  // Get the category information from persona config  
  const personaData = MasterPersonas[persona];
  let categoryDisplayName = category_display_name;

  if (persona === 'current_affairs') {
    const date = new Date(effectiveDate);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    canonicalKey = generateCanonicalKey(persona, category, String(year), month);
    playlistTitle = `🔥 ${category_display_name} ${month} ${year} | #CurrentAffairs #ExamPrep #Competition`;
  } else {
    // Use category level only for broader playlist organization
    categoryDisplayName = personaData?.subCategories?.find(cat => cat.key === category)?.displayName || category_display_name;
    
    canonicalKey = generateCanonicalKey(persona, category);
    
    // Generate viral hashtags based on persona
    const hashtags = generateViralHashtags(persona, categoryDisplayName);
    playlistTitle = `🎯 ${categoryDisplayName} | ${hashtags}`;
  }
    
  if (playlistMap.has(canonicalKey)) {
    return playlistMap.get(canonicalKey)!;
  }

  console.log(`Creating new playlist: "${playlistTitle}" for key "${canonicalKey}"...`);
  
  const tag = `${MANAGER_TAG_PREFIX}${canonicalKey}${MANAGER_TAG_SUFFIX}`;
  
  // Generate enhanced description with SEO keywords
  const seoKeywords = generateSEOKeywords(persona, categoryDisplayName);
  const playlistDescription = `🎓 Master ${categoryDisplayName} with expert quiz videos designed for ${personaDisplayName} students!

📚 Perfect for:
• Quick revision sessions
• Exam preparation 
• Concept reinforcement
• Self-assessment

🎯 Keywords: ${seoKeywords}

📈 Subscribe for daily educational content and boost your exam performance!

${tag}`;

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