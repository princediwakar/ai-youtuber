import { youtube_v3 } from 'googleapis';
import { MasterPersonas } from './personas';
import { QuizJob } from './types';
import { LayoutType, detectLayoutType } from '@/lib/visuals/layouts/layoutSelector';

// --- Constants and Configuration ---

const MANAGER_TAG = (key: string) => `[managed-by:quiz-app; key:${key}]`;
const playlistCreationLocks = new Map<string, Promise<string>>();

const FORMAT_DISPLAY_NAMES: Record<LayoutType, string> = {
  mcq: 'Quiz Questions', common_mistake: 'Common Mistakes', quick_fix: 'Quick Fixes', 
  usage_demo: 'Usage Examples', quick_tip: 'Quick Tips', before_after: 'Before & After', 
  challenge: 'Interactive Challenges'
};

// A centralized configuration for generating titles and descriptions per account/persona.
const CONTENT_CONFIG: Record<string, any> = {
  english_shots: {
    prefix: 'English Vocabulary',
    outro: `🎯 Why choose this playlist?\n• Perfect for all levels (Beginner to Advanced)\n• Helps you prepare for exams like IELTS, TOEFL, and TOEIC\n\n💡 Study Plan: Watch daily → Practice → Learn → Speak with confidence!`,
    intros: {
      mcq: `🚀 Master {TOPIC} with interactive quiz questions! Test your knowledge and boost your English vocabulary.`,
      common_mistake: `🚀 Stop making {TOPIC} mistakes that 99% of learners make! Fix your English errors instantly.`,
      quick_fix: `🚀 Upgrade your {TOPIC} vocabulary instantly! Transform basic words into sophisticated expressions.`,
    }
  },
  brain_health_tips: {
    prefix: 'Brain Health',
    outro: `🎯 Why trust our content?\n• Created by certified health professionals\n• Based on latest neuroscience research\n\n💡 Your brain health journey: Watch → Apply → Track progress → Feel the difference!`,
    intros: {
      mcq: `🧠 Test your {TOPIC} knowledge with brain health quizzes! Science-backed questions for cognitive wellness.`,
      quick_tip: `🧠 Boost your brain health with {TOPIC} quick tips! 30-second science-backed advice for cognitive wellness.`,
    }
  },
  eye_health_tips: {
    prefix: 'Eye Health',
    outro: `🎯 Why choose our eye care advice?\n• Created by certified optometrists\n• Evidence-based prevention methods\n\n💡 Your vision care plan: Watch → Practice → Protect → Maintain healthy eyes!`,
    intros: {
      mcq: `👁️ Test your {TOPIC} knowledge with eye health quizzes! Professional vision care questions for digital age protection.`,
      quick_tip: `👁️ Protect your eyes with {TOPIC} quick tips! 30-second vision care advice from eye health experts.`,
    }
  },
  ssc_shots: {
    prefix: 'SSC Exam Prep',
    outro: `🎯 Why choose this playlist?\n• Designed specifically for SSC exam patterns\n• Created by government exam preparation experts\n\n💡 Study Plan: Watch daily → Practice → Revise → Clear your government exam!`,
    intros: {
      mcq: `📚 Master {TOPIC} with targeted SSC practice questions! Government exam preparation made effective.`,
      quick_tip: `📚 Ace {TOPIC} with expert SSC preparation tips! Government exam success in bite-sized content.`,
      common_mistake: `📚 Avoid {TOPIC} mistakes that cost exam marks! Learn what 90% of SSC aspirants get wrong.`,
    }
  },
  astronomy_shots: {
    prefix: 'Space Facts',
    outro: `🎯 Why choose this playlist?\n• Mind-blowing facts that sound impossible but are true\n• Perfect for space enthusiasts and curious minds\n\n💡 Your cosmic journey: Watch → Wonder → Share → Explore the universe!`,
    intros: {
      mcq: `🚀 Test your {TOPIC} knowledge with mind-blowing space quizzes! Universe facts that will leave you speechless.`,
      common_mistake: `🚀 Stop believing {TOPIC} space myths! Learn what 99% of people get wrong about the universe.`,
      quick_tip: `🚀 Blow your mind with {TOPIC} cosmic facts! 30-second space revelations that change everything.`,
    }
  }
};


// --- Helper Functions ---

/** Generates a URL-safe key from string parts. */
export function generateCanonicalKey(...parts: (string | undefined | null)[]): string {
  const sanitize = (str: string | undefined | null) => 
    str ? str.toLowerCase().trim().replace(/[\s&]+/g, '-') : '';
  return parts.map(sanitize).filter(Boolean).join('-');
}

/** Detects the layout type from job data, defaulting to 'mcq'. */
function detectFormatFromJob(job: QuizJob): LayoutType {
  const sources: (string | undefined)[] = [
    job.data?.layoutType,
    job.format_type,
    job.data?.content ? detectLayoutType(job.data.content) : undefined,
  ];
  const format = sources.find(f => f && f in FORMAT_DISPLAY_NAMES) as LayoutType;
  return format || 'mcq';
}

/** Generates a playlist title. */
function generatePlaylistTitle(accountId: string, persona: string, topic: string, format: LayoutType): string {
  const configKey = accountId === 'health_shots' ? persona : accountId;
  const config = CONTENT_CONFIG[configKey] || {};
  const prefix = config.prefix || topic;
  const formatName = FORMAT_DISPLAY_NAMES[format];
  return `${prefix}: ${topic} | ${formatName}`;
}

/** Generates hashtags and SEO keywords. */
function generateTags(accountId: string, persona: string, topic: string, format: LayoutType): { hashtags: string, keywords: string } {
  // Define base and format-specific tags here to keep it concise
  const baseHashtags = ['#Learn', '#Tips', `#${topic.replace(/\s/g, '')}`];
  const baseKeywords = ['educational content', 'learning', topic.toLowerCase()];
  
  // In a real implementation, you would have your full maps here.
  // This is a simplified placeholder.
  const hashtags = [...baseHashtags, `#${format}`].slice(0, 6).join(' ');
  const keywords = [...baseKeywords, format].slice(0, 10).join(', ');
  
  return { hashtags, keywords };
}

/** Generates a playlist description using the centralized config. */
async function generatePlaylistDescription(accountId: string, persona: string, topic: string, format: LayoutType, key: string): Promise<string> {
  const configKey = accountId === 'health_shots' ? persona : accountId;
  const config = CONTENT_CONFIG[configKey];
  const formatName = FORMAT_DISPLAY_NAMES[format];
  const { hashtags, keywords } = generateTags(accountId, persona, topic, format);
  
  if (!config) {
    return `Educational content on ${topic}.\n\nKeywords: ${keywords}\n${hashtags}\n\n${MANAGER_TAG(key)}`;
  }

  const intro = (config.intros[format] || config.intros.mcq).replace('{TOPIC}', topic);
  const outro = `${config.outro}\n🔔 New ${formatName.toLowerCase()} uploaded regularly!`;

  return `${intro}\n\n${outro}\n\nKeywords: ${keywords}\n${hashtags}\n\n${MANAGER_TAG(key)}`;
}

/** Parses the canonical key from a playlist's description. */
function parseCanonicalKeyFromDescription(desc?: string | null): string | null {
  const match = desc?.match(/\[managed-by:quiz-app; key:(.*?)]/);
  return match ? match[1] : null;
}


// --- Core YouTube API Logic ---

/** Fetches all playlists managed by this application. */
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

/** Creates a new playlist if it doesn't already exist. */
async function createPlaylist(youtube: youtube_v3.Youtube, title: string, description: string): Promise<string> {
  try {
    const res = await youtube.playlists.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: { title, description },
        status: { privacyStatus: 'public' },
      },
    });
    if (!res.data.id) throw new Error("YouTube API did not return a playlist ID.");
    console.log(`Created playlist ID: ${res.data.id}`);
    return res.data.id;
  } catch (error) {
    console.error(`Failed to create playlist "${title}":`, error);
    throw error;
  }
}

/** Gets an existing playlist ID or creates a new one, preventing race conditions. */
export async function getOrCreatePlaylist(
  youtube: youtube_v3.Youtube,
  job: QuizJob,
  playlistMap: Map<string, string>
): Promise<string> {
  const { account_id, persona, topic, data } = job;
  const format = detectFormatFromJob(job);

  const topicKey = data?.content?.topic || data?.question?.topic || topic;
  const subCat = MasterPersonas[persona]?.subCategories?.find(c => c.key === topicKey);
  const topicName = subCat?.displayName || job.topic_display_name || data?.topic_display_name || topic;

  const canonicalKey = generateCanonicalKey(account_id, persona, topicKey, format);

  if (playlistMap.has(canonicalKey)) return playlistMap.get(canonicalKey)!;
  if (playlistCreationLocks.has(canonicalKey)) return playlistCreationLocks.get(canonicalKey)!;

  const creationPromise = (async () => {
    const title = generatePlaylistTitle(account_id, persona, topicName, format);
    const description = await generatePlaylistDescription(account_id, persona, topicName, format, canonicalKey);
    const newPlaylistId = await createPlaylist(youtube, title, description);
    playlistMap.set(canonicalKey, newPlaylistId);
    return newPlaylistId;
  })();

  playlistCreationLocks.set(canonicalKey, creationPromise);
  creationPromise.finally(() => playlistCreationLocks.delete(canonicalKey));
  
  return creationPromise;
}