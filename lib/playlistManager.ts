// lib/playlistManager.ts
import { youtube_v3 } from 'googleapis';
import { MasterPersonas } from './personas';
import { QuizJob } from './types';
import { LayoutType, detectLayoutType } from '@/lib/visuals/layouts/layoutSelector';
import { PersonaType, FormatType } from './generation/shared/types';

// --- Constants and Configuration ---

const MANAGER_TAG = (key: string) => `[managed-by:quiz-app; key:${key}]`;
const playlistCreationLocks = new Map<string, Promise<string>>();

const FORMAT_DISPLAY_NAMES: Record<LayoutType, string> = {
  simplified_word: 'Vocabulary Lessons',
  mcq: 'Quiz Questions', common_mistake: 'Common Mistakes', quick_fix: 'Quick Fixes', 
  usage_demo: 'Usage Examples', quick_tip: 'Quick Tips', 
};

interface ContentConfig {
  prefix: string;
  outro: string;
  intros: Partial<Record<FormatType, string>>;
}

const CONTENT_CONFIG: Record<string, ContentConfig> = {
  english_shots: {
    prefix: 'English Vocabulary',
    outro: `🎯 Why choose this playlist?\n• Perfect for all levels (Beginner to Advanced)\n• Helps you prepare for exams like IELTS, TOEFL, and TOEIC\n\n💡 Study Plan: Watch daily → Practice → Learn → Speak with confidence!`,
    intros: {
      mcq: `🚀 Master {TOPIC} with interactive quiz questions! Test your knowledge and boost your English vocabulary.`,
      common_mistake: `🚀 Stop making {TOPIC} mistakes that 99% of learners make! Fix your English errors instantly.`,
      quick_fix: `🚀 Upgrade your {TOPIC} vocabulary instantly! Transform basic words into sophisticated expressions.`,
      usage_demo: `🚀 See {TOPIC} in action! Real-world usage examples that make English natural.`,
      quick_tip: `🚀 Master {TOPIC} with lightning-fast tips! English fluency shortcuts revealed.`,
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
    }
  },
  space_facts_quiz: {
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
  const configKey = accountId === 'health_shots' ? persona : (persona === 'space_facts_quiz' ? 'space_facts_quiz' : accountId);
  const config = CONTENT_CONFIG[configKey] || {};
  const prefix = (config as any).prefix || topicName;
  const formatName = FORMAT_DISPLAY_NAMES[format as LayoutType] || 'Content';
  return `${prefix}: ${topicName} | ${formatName}`;
}

function generateTags(accountId: string, persona: PersonaType, topicName: string, format: FormatType): { hashtags: string, keywords: string } {
    const baseHashtags = ['#Learn', '#Tips', `#${topicName.replace(/\s/g, '')}`];
    const baseKeywords = ['educational content', 'learning', topicName.toLowerCase()];

    const personaHashtags: Partial<Record<PersonaType, string[]>> = {
        english_vocab_builder: ['#English', '#Vocabulary', '#Grammar', '#IELTS', '#TOEFL'],
        brain_health_tips: ['#BrainHealth', '#Memory', '#Focus', '#Wellness', '#Neuroscience'],
        eye_health_tips: ['#EyeHealth', '#Vision', '#ScreenTime', '#EyeCare', '#DigitalWellness'],
        ssc_shots: ['#SSC', '#GovernmentExam', '#Study', '#Preparation', '#CurrentAffairs'],
        space_facts_quiz: ['#Space', '#Astronomy', '#Science', '#Universe', '#Facts']
    };

    const formatHashtags: Partial<Record<FormatType, string[]>> = {
        mcq: ['#Quiz', '#Test', '#MCQ'],
        quick_tip: ['#QuickTip', '#Hack', '#Secret'],
    };

    const allHashtags = [...new Set([...baseHashtags, ...(personaHashtags[persona] || []), ...(formatHashtags[format] || [])])].slice(0, 8);
    const allKeywords = [...new Set([...baseKeywords, persona.replace(/_/g, ' '), format.replace(/_/g, ' '), 'short video'])].slice(0, 12);

    return { hashtags: allHashtags.join(' '), keywords: allKeywords.join(', ') };
}

async function generatePlaylistDescription(accountId: string, persona: PersonaType, topicName: string, format: FormatType, key: string): Promise<string> {
  const configKey = accountId === 'health_shots' ? persona : (persona === 'space_facts_quiz' ? 'space_facts_quiz' : accountId);
  const config = CONTENT_CONFIG[configKey];
  const formatName = FORMAT_DISPLAY_NAMES[format as LayoutType] || 'Content';
  const { hashtags, keywords } = generateTags(accountId, persona, topicName, format);
  
  if (!config) {
    return `Educational content on ${topicName}.\n\nKeywords: ${keywords}\n${hashtags}\n\n${MANAGER_TAG(key)}`;
  }

  const intro = (config.intros[format] || config.intros.mcq || `Learn about {TOPIC} with interactive content!`).replace('{TOPIC}', topicName);
  const outro = `${config.outro}\n🔔 New ${formatName.toLowerCase()} uploaded regularly!`;

  return `${intro}\n\n${outro}\n\nKeywords: ${keywords}\n${hashtags}\n\n${MANAGER_TAG(key)}`;
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
