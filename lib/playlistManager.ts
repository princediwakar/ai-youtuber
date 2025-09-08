import { youtube_v3 } from 'googleapis';
import { MasterPersonas } from './personas';
import { QuizJob } from './types';
import { getAccountConfig } from './accounts';
import { LayoutType } from '@/lib/visuals/layouts/layoutSelector';

const MANAGER_TAG_PREFIX = '[managed-by:quiz-app; key:';
const MANAGER_TAG_SUFFIX = ']';

// In-memory lock to prevent duplicate playlist creation
const playlistCreationLocks = new Map<string, Promise<string>>();

// Format-Persona mapping for supported layouts
const PERSONA_FORMAT_MAP: Record<string, LayoutType[]> = {
  'english_vocab_builder': ['mcq', 'common_mistake', 'quick_fix', 'usage_demo'],
  'brain_health_tips': ['mcq', 'quick_tip', 'before_after', 'challenge'],
  'eye_health_tips': ['mcq', 'quick_tip', 'before_after', 'challenge'],
};

// Format display names for better playlist organization
const FORMAT_DISPLAY_NAMES: Record<LayoutType, string> = {
  'mcq': 'Quiz Questions',
  'common_mistake': 'Common Mistakes',
  'quick_fix': 'Quick Fixes', 
  'usage_demo': 'Usage Examples',
  'quick_tip': 'Quick Tips',
  'before_after': 'Before & After',
  'challenge': 'Interactive Challenges'
};

/**
 * Detects the format/layout type from job data
 */
function detectFormatFromJob(jobData: QuizJob): LayoutType {
  // Try to get format from multiple sources in order of preference
  const layoutFromData = jobData.data?.layoutType;
  const formatType = jobData.format_type;
  const contentData = jobData.data?.content;
  
  if (layoutFromData && Object.keys(FORMAT_DISPLAY_NAMES).includes(layoutFromData)) {
    return layoutFromData as LayoutType;
  }
  
  if (formatType && Object.keys(FORMAT_DISPLAY_NAMES).includes(formatType)) {
    return formatType as LayoutType;
  }
  
  // Detect from content structure with safe property access
  if (contentData && typeof contentData === 'object') {
    if (contentData.hook && contentData.mistake && contentData.correct && contentData.practice) {
      return 'common_mistake';
    }
    if (contentData.hook && contentData.basic_word && contentData.advanced_word) {
      return 'quick_fix';
    }
    if (contentData.hook && contentData.target_word && contentData.wrong_example && contentData.right_example) {
      return 'usage_demo';
    }
    if (contentData.hook && contentData.setup && contentData.challenge_type) {
      return 'challenge';
    }
    if (contentData.hook && contentData.action && contentData.result) {
      return 'quick_tip';
    }
    if (contentData.hook && contentData.before && contentData.after) {
      return 'before_after';
    }
  }
  
  // Default to MCQ
  return 'mcq';
}

/**
 * Generates a consistent, URL-safe key from multiple identifying parts.
 */
export function generateCanonicalKey(...parts: (string | undefined | null)[]): string {
  const sanitize = (str: string | undefined | null) => 
    str ? str.toLowerCase().trim().replace(/[\s&]+/g, '-') : '';
  return parts.map(sanitize).filter(Boolean).join('-');
}

/**
 * Generates relevant hashtags based on account, persona, and format.
 */
function generateHashtags(accountId: string, persona: string, topicDisplayName: string, format: LayoutType): string {
  const baseHashtagMap: Record<string, Record<string, string[]>> = {
    english_shots: {
      english_vocab_builder: ['#LearnEnglish', '#EnglishVocabulary', '#Vocabulary', '#ESL']
    },
    health_shots: {
      brain_health_tips: ['#BrainHealth', '#Memory', '#Focus', '#CognitiveHealth', '#Wellness'],
      eye_health_tips: ['#EyeHealth', '#VisionCare', '#ScreenTime', '#EyeCare', '#HealthyEyes']
    }
  };

  // Format-specific hashtags
  const formatHashtagMap: Record<LayoutType, string[]> = {
    'mcq': ['#Quiz', '#MCQ', '#Questions'],
    'common_mistake': ['#CommonMistakes', '#ErrorCorrection', '#Fix'],
    'quick_fix': ['#QuickFix', '#VocabUpgrade', '#WordChoice'],
    'usage_demo': ['#UsageDemo', '#Examples', '#Context'],
    'quick_tip': ['#QuickTips', '#HealthHacks', '#Wellness'],
    'before_after': ['#BeforeAfter', '#Transformation', '#Results'],
    'challenge': ['#Challenge', '#BrainTraining', '#Interactive']
  };

  const accountHashtags = baseHashtagMap[accountId] || {};
  const baseHashtags = accountHashtags[persona] || ['#Health', '#Tips', '#Wellness'];
  const formatHashtags = formatHashtagMap[format] || [];
  
  // Combine base and format hashtags
  let combinedHashtags = [...baseHashtags, ...formatHashtags];
  
  // Add topic-specific hashtags
  const topicKey = topicDisplayName.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
  if (topicKey.length > 2) {
    combinedHashtags.push(`#${topicKey}`);
  }

  return combinedHashtags.slice(0, 6).join(' ');
}

/**
 * Generates account-specific playlist titles with format context.
 */
function generatePlaylistTitle(accountId: string, persona: string, topicDisplayName: string, format: LayoutType): string {
  const formatName = FORMAT_DISPLAY_NAMES[format];
  
  const titleTemplates: Record<string, Record<string, Record<LayoutType, string>>> = {
    english_shots: {
      english_vocab_builder: {
        'mcq': `English Vocabulary: ${topicDisplayName} | Quiz Questions`,
        'common_mistake': `English Vocabulary: ${topicDisplayName} | Common Mistakes`,
        'quick_fix': `English Vocabulary: ${topicDisplayName} | Quick Fixes`,
        'usage_demo': `English Vocabulary: ${topicDisplayName} | Usage Examples`,
        'quick_tip': `English Vocabulary: ${topicDisplayName} | Quick Tips`,
        'before_after': `English Vocabulary: ${topicDisplayName} | Before & After`,
        'challenge': `English Vocabulary: ${topicDisplayName} | Challenges`
      }
    },
    health_shots: {
      brain_health_tips: {
        'mcq': `Brain Health: ${topicDisplayName} | Quiz Questions`,
        'quick_tip': `Brain Health: ${topicDisplayName} | Quick Tips`,
        'before_after': `Brain Health: ${topicDisplayName} | Before & After`,
        'challenge': `Brain Health: ${topicDisplayName} | Interactive Challenges`,
        'common_mistake': `Brain Health: ${topicDisplayName} | Common Mistakes`,
        'quick_fix': `Brain Health: ${topicDisplayName} | Quick Fixes`,
        'usage_demo': `Brain Health: ${topicDisplayName} | Usage Examples`
      },
      eye_health_tips: {
        'mcq': `Eye Health: ${topicDisplayName} | Quiz Questions`,
        'quick_tip': `Eye Health: ${topicDisplayName} | Vision Care Tips`,
        'before_after': `Eye Health: ${topicDisplayName} | Before & After`,
        'challenge': `Eye Health: ${topicDisplayName} | Vision Challenges`,
        'common_mistake': `Eye Health: ${topicDisplayName} | Common Mistakes`,
        'quick_fix': `Eye Health: ${topicDisplayName} | Quick Fixes`,
        'usage_demo': `Eye Health: ${topicDisplayName} | Usage Examples`
      }
    }
  };

  const accountTemplates = titleTemplates[accountId];
  const personaTemplates = accountTemplates?.[persona];
  const formatTitle = personaTemplates?.[format];
  
  return formatTitle || `${topicDisplayName}: ${formatName} | Educational Content`;
}

/**
 * Generates SEO-optimized keywords based on account focus and format type.
 */
function generateSEOKeywords(accountId: string, persona: string, topicDisplayName: string, format: LayoutType): string {
  const baseKeywordMap: Record<string, Record<string, string[]>> = {
    english_shots: {
      english_vocab_builder: ['learn english', 'english vocabulary', 'ESL lessons', 'IELTS vocabulary', 'TOEFL words', 'speak english fluently']
    },
    health_shots: {
      brain_health_tips: ['brain health', 'memory improvement', 'cognitive function', 'mental wellness', 'focus techniques', 'brain exercises'],
      eye_health_tips: ['eye health', 'vision care', 'screen time protection', 'eye exercises', 'digital eye strain', 'eye safety']
    }
  };

  // Format-specific keywords
  const formatKeywordMap: Record<LayoutType, string[]> = {
    'mcq': ['quiz questions', 'multiple choice', 'test yourself', 'knowledge quiz'],
    'common_mistake': ['common mistakes', 'error correction', 'fix mistakes', 'avoid errors'],
    'quick_fix': ['quick fixes', 'vocabulary upgrade', 'word improvement', 'better words'],
    'usage_demo': ['usage examples', 'word context', 'proper usage', 'examples'],
    'quick_tip': ['quick tips', 'health hacks', 'instant tips', 'actionable advice'],
    'before_after': ['before after', 'transformation', 'results', 'improvement'],
    'challenge': ['brain challenge', 'interactive quiz', 'brain training', 'mental exercise']
  };

  const accountKeywords = baseKeywordMap[accountId] || {};
  const baseKeywords = accountKeywords[persona] || ['educational content', 'tips', 'learning'];
  const formatKeywords = formatKeywordMap[format] || [];
  const topicKeyword = topicDisplayName.toLowerCase();
  
  // Combine all keywords
  const allKeywords = [...baseKeywords, ...formatKeywords, topicKeyword];
  
  return allKeywords.slice(0, 10).join(', ');
}

/**
 * Generates account-specific playlist descriptions with format context.
 */
async function generatePlaylistDescription(accountId: string, persona: string, topicDisplayName: string, format: LayoutType, canonicalKey: string): Promise<string> {
  const account = await getAccountConfig(accountId);
  const seoKeywords = generateSEOKeywords(accountId, persona, topicDisplayName, format);
  const hashtags = generateHashtags(accountId, persona, topicDisplayName, format);
  const tag = `${MANAGER_TAG_PREFIX}${canonicalKey}${MANAGER_TAG_SUFFIX}`;
  const formatName = FORMAT_DISPLAY_NAMES[format];

  if (accountId === 'english_shots') {
    const formatDescriptions: Record<LayoutType, string> = {
      'mcq': `🚀 Master ${topicDisplayName} with interactive quiz questions! Test your knowledge and boost your English vocabulary.

✅ What you'll get:
• Multiple choice questions on essential vocabulary
• Instant feedback with detailed explanations
• Progressive difficulty levels
• Quick 30-second learning videos`,
      'common_mistake': `🚀 Stop making ${topicDisplayName} mistakes that 99% of learners make! Fix your English errors instantly.

✅ What you'll get:
• Common mistakes identified and corrected
• Native speaker alternatives
• Pronunciation guides
• Real-world usage examples`,
      'quick_fix': `🚀 Upgrade your ${topicDisplayName} vocabulary instantly! Transform basic words into sophisticated expressions.

✅ What you'll get:
• Professional word alternatives
• Advanced vocabulary substitutions
• Context-appropriate upgrades
• Confidence-building transformations`,
      'usage_demo': `🚀 Master ${topicDisplayName} usage with real examples! Learn when and how to use advanced vocabulary correctly.

✅ What you'll get:
• Correct vs incorrect usage demonstrations
• Professional context examples
• Native speaker patterns
• Practical application scenarios`,
      'quick_tip': `🚀 Master ${topicDisplayName} with quick, actionable tips! Improve your English in just 30 seconds per video.

✅ What you'll get:
• Instant improvement techniques
• Practical daily tips
• Easy-to-remember strategies
• Immediate confidence boosts`,
      'before_after': `🚀 Transform your ${topicDisplayName} skills with before/after comparisons! See dramatic improvements instantly.

✅ What you'll get:
• Clear improvement demonstrations
• Professional transformations
• Practical upgrade strategies
• Confidence-building results`,
      'challenge': `🚀 Challenge yourself with ${topicDisplayName} interactive exercises! Test and improve your English skills.

✅ What you'll get:
• Interactive vocabulary challenges
• Brain-training exercises
• Progressive skill building
• Engaging learning activities`
    };
    
    const formatContent = formatDescriptions[format] || formatDescriptions['mcq'];
    
    return `${formatContent}

🎯 Why choose this playlist?
• Perfect for all levels (Beginner to Advanced)
• Helps you prepare for exams like IELTS, TOEFL, and TOEIC
• Created by English language experts
• Proven to expand your vocabulary and boost confidence

💡 Study Plan: Watch daily → Practice → Learn → Speak with confidence!
🔔 New ${formatName.toLowerCase()} uploaded regularly!

🏆 Join thousands of learners who are improving their English with us!

Keywords: ${seoKeywords}
${hashtags}

${tag}`;
  }

  if (accountId === 'health_shots') {
    if (persona === 'brain_health_tips') {
      const brainFormatDescriptions: Record<LayoutType, string> = {
        'mcq': `🧠 Test your ${topicDisplayName} knowledge with brain health quizzes! Science-backed questions for cognitive wellness.

✅ What you'll learn:
• Evidence-based brain health facts
• Memory and focus assessments
• Cognitive wellness knowledge
• Interactive learning experience`,
        'quick_tip': `🧠 Boost your brain health with ${topicDisplayName} quick tips! 30-second science-backed advice for cognitive wellness.

✅ What you'll learn:
• Instant brain health improvements
• Daily cognitive enhancement tips
• Memory and focus shortcuts
• Easy-to-apply strategies`,
        'before_after': `🧠 Transform your ${topicDisplayName} with before/after brain health strategies! See the difference science-backed changes make.

✅ What you'll learn:
• Cognitive transformation examples
• Brain health improvements
• Memory enhancement results
• Real-world brain changes`,
        'challenge': `🧠 Challenge your brain with ${topicDisplayName} interactive exercises! Fun, science-based cognitive training.

✅ What you'll learn:
• Interactive brain training
• Memory enhancement exercises
• Cognitive skill challenges
• Fun mental workouts`,
        'common_mistake': `🧠 Avoid ${topicDisplayName} brain health mistakes! Learn what 99% of people get wrong about cognitive wellness.

✅ What you'll learn:
• Common brain health errors
• Myth-busting facts
• Correct cognitive strategies
• Science-backed corrections`,
        'quick_fix': `🧠 Fix your ${topicDisplayName} brain health instantly! Quick solutions for common cognitive issues.

✅ What you'll learn:
• Instant brain health fixes
• Quick cognitive improvements
• Simple memory solutions
• Fast focus enhancements`,
        'usage_demo': `🧠 See ${topicDisplayName} brain health techniques in action! Real examples of cognitive improvement strategies.

✅ What you'll learn:
• Practical brain health demonstrations
• Real-world cognitive applications
• Step-by-step brain training
• Evidence-based examples`
      };
      
      const brainContent = brainFormatDescriptions[format] || brainFormatDescriptions['mcq'];
      
      return `${brainContent}

🎯 Why trust our content?
• Created by certified health professionals
• Based on latest neuroscience research
• Practical tips you can use immediately
• Suitable for all ages and fitness levels

💡 Your brain health journey: Watch → Apply → Track progress → Feel the difference!
🔔 New ${formatName.toLowerCase()} uploaded regularly!

🏆 Join thousands improving their cognitive wellness with us!

Keywords: ${seoKeywords}
${hashtags}

${tag}`;
    }

    if (persona === 'eye_health_tips') {
      const eyeFormatDescriptions: Record<LayoutType, string> = {
        'mcq': `👁️ Test your ${topicDisplayName} knowledge with eye health quizzes! Professional vision care questions for digital age protection.

✅ What you'll discover:
• Vision care assessments
• Eye health knowledge tests
• Screen protection quizzes
• Interactive eye care learning`,
        'quick_tip': `👁️ Protect your eyes with ${topicDisplayName} quick tips! 30-second vision care advice from eye health experts.

✅ What you'll discover:
• Instant eye protection strategies
• Daily vision care shortcuts
• Screen time safety tips
• Quick eye exercise routines`,
        'before_after': `👁️ Transform your ${topicDisplayName} with before/after vision care! See the difference proper eye health makes.

✅ What you'll discover:
• Eye health transformation examples
• Vision improvement results
• Screen strain recovery stories
• Real eye care outcomes`,
        'challenge': `👁️ Challenge your vision with ${topicDisplayName} eye health exercises! Interactive training for stronger, healthier eyes.

✅ What you'll discover:
• Interactive eye exercises
• Vision training challenges
• Eye strength workouts
• Fun eye health activities`,
        'common_mistake': `👁️ Avoid ${topicDisplayName} eye health mistakes! Learn what damages your vision that you never knew about.

✅ What you'll discover:
• Hidden vision threats
• Common eye care errors
• Digital age vision mistakes
• Professional corrections`,
        'quick_fix': `👁️ Fix your ${topicDisplayName} eye problems instantly! Quick solutions for common vision issues.

✅ What you'll discover:
• Instant eye strain relief
• Quick vision improvements
• Fast eye care solutions
• Immediate protection strategies`,
        'usage_demo': `👁️ See ${topicDisplayName} eye care techniques in action! Real examples of vision protection strategies.

✅ What you'll discover:
• Practical eye care demonstrations
• Real-world vision applications
• Step-by-step eye exercises
• Professional technique examples`
      };
      
      const eyeContent = eyeFormatDescriptions[format] || eyeFormatDescriptions['mcq'];
      
      return `${eyeContent}

🎯 Why choose our eye care advice?
• Created by certified optometrists
• Evidence-based prevention methods
• Perfect for screen users and professionals
• Easy-to-follow daily practices

💡 Your vision care plan: Watch → Practice → Protect → Maintain healthy eyes!
🔔 New ${formatName.toLowerCase()} uploaded weekly!

🏆 Join thousands protecting their vision with us!

Keywords: ${seoKeywords}
${hashtags}

${tag}`;
    }
  }

  // Fallback description
  return `📚 Expert ${formatName.toLowerCase()} on ${topicDisplayName} from ${account.name}. 

Educational content designed for ${account.branding.audience} with a ${account.branding.tone} approach.

✅ Content format: ${formatName}

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
  
  // Get account from job data
  const account = await getAccountConfig(jobData.account_id);
  const accountId = account.id;
  
  // Detect format from job data
  const detectedFormat = detectFormatFromJob(jobData);
  
  const topic_display_name = jobData.topic_display_name || data?.topic_display_name || topic;
  let canonicalKey: string;
  let playlistTitle: string;

  const personaData = MasterPersonas[persona];
  let topicDisplayName = topic_display_name;

  // Get proper topic display name with null checks
  const topicKey = (data?.content as any)?.topic || (data?.question as any)?.topic || topic;
  if (personaData?.subCategories) {
    const foundCategory = personaData.subCategories.find(cat => cat.key === topicKey);
    topicDisplayName = foundCategory?.displayName || topic_display_name || topic;
  } else {
    topicDisplayName = topic_display_name || topic;
  }
  
  // Generate account-specific canonical key and title with format
  canonicalKey = generateCanonicalKey(accountId, persona, topicKey || topic, detectedFormat);
  playlistTitle = generatePlaylistTitle(accountId, persona, topicDisplayName || topic, detectedFormat);
    
  if (playlistMap.has(canonicalKey)) {
    return playlistMap.get(canonicalKey)!;
  }

  if (playlistCreationLocks.has(canonicalKey)) {
    console.log(`Waiting for existing playlist creation for key "${canonicalKey}"...`);
    return await playlistCreationLocks.get(canonicalKey)!;
  }

  console.log(`Creating new ${account.name} playlist: "${playlistTitle}" (${FORMAT_DISPLAY_NAMES[detectedFormat]}) for key "${canonicalKey}"...`);
  
  const playlistDescription = await generatePlaylistDescription(accountId, persona, topicDisplayName, detectedFormat, canonicalKey);

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