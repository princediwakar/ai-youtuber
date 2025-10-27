// lib/playlistManager.ts
import { youtube_v3 } from 'googleapis';
import { MasterPersonas } from './personas';
import { QuizJob } from './types';
import { LayoutType, detectLayoutType } from '@/lib/visuals/layouts/layoutSelector';
import { PersonaType, FormatType } from './generation/shared/types';

// --- Constants and Configuration ---

const MANAGER_TAG = (key: string) => `[managed-by:quiz-app; key:${key}]`;
const playlistCreationLocks = new Map<string, Promise<string>>();

// Simplified: Only active formats (MCQ + Quick Tip)
const FORMAT_DISPLAY_NAMES: Record<LayoutType, string> = {
  mcq: 'Quiz',
  quick_tip: 'Quick Tips',
  // Legacy formats (not in rotation but kept for old videos)
  simplified_word: 'Vocabulary',
};

interface ContentConfig {
  prefix: string;
  outro: string;
  intros: Partial<Record<FormatType, string>>;
}

// Simplified: Direct, beginner-friendly descriptions (following 2025-10-10 content strategy)
const CONTENT_CONFIG: Record<string, ContentConfig> = {
  english_shots: {
    prefix: 'English',
    outro: `📚 Learn English vocabulary for IELTS, TOEFL & daily use.\n🔔 New videos daily!`,
    intros: {
      mcq: `Learn {TOPIC} vocabulary with quiz questions.`,
      quick_tip: `Quick tips for {TOPIC} - improve your English fast.`,
    }
  },
  mental_health_tips: {
    prefix: 'Mental Health',
    outro: `🧠 Simple tips for a healthier mind.\n🔔 New tips regularly!`,
    intros: {
      mcq: `Test your {TOPIC} knowledge - mental health quiz.`,
      quick_tip: `{TOPIC} tips for better mental wellness.`,
    }
  },
  general_health_tips: {
    prefix: 'General Health',
    outro: `💪 Simple tips for a healthy body.\n🔔 Stay healthy!`,
    intros: {
      mcq: `Test your {TOPIC} knowledge - general health quiz.`,
      quick_tip: `{TOPIC} tips for your overall wellness.`,
    }
  },
  ssc_shots: {
    prefix: 'SSC Exam',
    outro: `📚 SSC exam preparation made simple.\n🔔 Daily practice questions!`,
    intros: {
      mcq: `SSC {TOPIC} practice questions for exam prep.`,
      quick_tip: `Quick {TOPIC} tips for SSC exam success.`,
    }
  },
  space_facts_quiz: {
    prefix: 'Space Facts',
    outro: `🚀 Mind-blowing facts about space.\n🔔 Explore the universe!`,
    intros: {
      mcq: `Test your {TOPIC} knowledge - space quiz.`,
      quick_tip: `Amazing {TOPIC} facts about space.`,
    }
  }
};

// --- Helper Functions ---

// Centralized config lookup (removes duplicate logic)
function getConfigKey(accountId: string, persona: string): string {
  if (accountId === 'health_shots') return persona;
  if (persona === 'space_facts_quiz') return 'space_facts_quiz';
  return accountId;
}

export function generateCanonicalKey(...parts: (string | undefined | null)[]): string {
  const sanitize = (str: string | undefined | null) =>
    str ? str.toLowerCase().trim().replace(/[\s&]+/g, '-') : '';
  return parts.map(sanitize).filter(Boolean).join('-');
}

function detectFormatFromJob(job: QuizJob): LayoutType {
  const sources = [
    job.data?.layoutType,
    job.format_type,
    job.data?.content ? detectLayoutType(job.data.content) : undefined,
  ];
  const format = sources.find(f => f && f in FORMAT_DISPLAY_NAMES) as LayoutType;
  return format || 'mcq';
}

// --- FIX: Logic is now more robust and consistent with metadata generation ---
function getTopicAndFormat(job: QuizJob): { topicName: string, format: FormatType } {
    const { persona, topic, topic_display_name, data } = job;
    const format = detectFormatFromJob(job) as FormatType;

    const contentTopic = data?.content?.topic;
    const subCat = MasterPersonas[persona as PersonaType]?.subCategories?.find(c => c.key === (contentTopic || topic));
    
    const topicName = subCat?.displayName || topic_display_name || contentTopic || topic;
    return { topicName, format };
}

function generatePlaylistTitle(accountId: string, persona: PersonaType, topicName: string, format: FormatType): string {
  const config = CONTENT_CONFIG[getConfigKey(accountId, persona)];
  const prefix = config?.prefix || topicName;
  const formatName = FORMAT_DISPLAY_NAMES[format as LayoutType] || 'Content';
  return `${prefix}: ${topicName} | ${formatName}`;
}

// Simplified: 3-8 hashtags optimal (research finding), focused keywords
function generateTags(accountId: string, persona: PersonaType, topicName: string, format: FormatType): { hashtags: string, keywords: string } {
    // Persona-specific core hashtags (3-5 each)
    const personaHashtags: Partial<Record<PersonaType, string[]>> = {
        english_vocab_builder: ['#English', '#Vocabulary', '#LearnEnglish', '#IELTS'],
        mental_health_tips: ['#MentalHealth', '#Wellness', '#Mindfulness', '#StressRelief'],
        general_health_tips: ['#HealthTips', '#GeneralHealth', '#Wellness', '#StayHealthy'],
        ssc_shots: ['#SSC', '#GovernmentExam', '#ExamPrep'],
        space_facts_quiz: ['#Space', '#Astronomy', '#Science']
    };

    const formatTag = format === 'quick_tip' ? '#Tips' : '#Quiz';
    const allHashtags = [...(personaHashtags[persona] || []), formatTag, '#Education'].slice(0, 7);
    const keywords = [topicName.toLowerCase(), persona.replace(/_/g, ' '), 'shorts', 'education'].join(', ');

    return { hashtags: allHashtags.join(' '), keywords };
}

// Simplified: Concise descriptions, SEO-focused
async function generatePlaylistDescription(accountId: string, persona: PersonaType, topicName: string, format: FormatType, key: string): Promise<string> {
  const config = CONTENT_CONFIG[getConfigKey(accountId, persona)];
  const { hashtags, keywords } = generateTags(accountId, persona, topicName, format);

  if (!config) {
    return `Learn ${topicName}.\n\nKeywords: ${keywords}\n${hashtags}\n\n${MANAGER_TAG(key)}`;
  }

  const intro = (config.intros[format] || config.intros.mcq || `Learn {TOPIC}.`).replace('{TOPIC}', topicName);

  return `${intro}\n\n${config.outro}\n\nKeywords: ${keywords}\n${hashtags}\n\n${MANAGER_TAG(key)}`;
}

function parseCanonicalKeyFromDescription(desc?: string | null): string | null {
  const match = desc?.match(/\[managed-by:quiz-app; key:(.*?)]/);
  return match ? match[1] : null;
}

// --- Core YouTube API Logic ---

export async function findManagedPlaylists(youtube: youtube_v3.Youtube): Promise<Map<string, string>> {
  const playlistMap = new Map<string, string>();
  let pageToken: string | undefined;

  do {
    const res = await youtube.playlists.list({ part: ['snippet'], mine: true, maxResults: 50, pageToken });
    res.data.items?.forEach(item => {
      const key = parseCanonicalKeyFromDescription(item.snippet?.description);
      if (key && item.id) playlistMap.set(key, item.id);
    });
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  
  console.log(`Found ${playlistMap.size} existing managed playlists.`);
  return playlistMap;
}

async function createPlaylist(youtube: youtube_v3.Youtube, title: string, description: string): Promise<string> {
  try {
    const res = await youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: { snippet: { title, description }, status: { privacyStatus: 'public' } },
    });
    if (!res.data.id) throw new Error("YouTube API did not return a playlist ID.");
    console.log(`Created playlist "${title}" with ID: ${res.data.id}`);
    return res.data.id;
  } catch (error) {
    console.error(`Failed to create playlist "${title}":`, error);
    throw error;
  }
}

export async function getOrCreatePlaylist(youtube: youtube_v3.Youtube, job: QuizJob, playlistMap: Map<string, string>): Promise<string> {
  const { account_id, persona } = job;
  const { topicName, format } = getTopicAndFormat(job);

  const canonicalKey = generateCanonicalKey(account_id, persona, topicName, format);

  if (playlistMap.has(canonicalKey)) return playlistMap.get(canonicalKey)!;
  if (playlistCreationLocks.has(canonicalKey)) return playlistCreationLocks.get(canonicalKey)!;

  const creationPromise = (async () => {
    const title = generatePlaylistTitle(account_id, persona as PersonaType, topicName, format);
    const description = await generatePlaylistDescription(account_id, persona as PersonaType, topicName, format, canonicalKey);
    const newPlaylistId = await createPlaylist(youtube, title, description);
    playlistMap.set(canonicalKey, newPlaylistId);
    return newPlaylistId;
  })();

  playlistCreationLocks.set(canonicalKey, creationPromise);
  creationPromise.finally(() => playlistCreationLocks.delete(canonicalKey));
  
  return creationPromise;
}