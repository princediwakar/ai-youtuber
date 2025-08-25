import OpenAI from 'openai'

// Initialize DeepSeek client using OpenAI SDK
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1'
})

export interface ContentAnalysis {
  videoTitle: string
  videoDescription: string
  playlistDescription: string
  tags: string[]
  category: string
  theme: string
  targetAudience: string
  skillLevel: string
}

export async function analyzeContent(
  folderName: string,
  allFileNames: string[],
  currentFileName: string,
  relativePath: string
): Promise<ContentAnalysis> {
  try {
    console.log('🔑 DeepSeek API Key available:', !!process.env.DEEPSEEK_API_KEY)
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }
    console.log('🎯 Analyzing content:', { folderName, currentFileName, fileCount: allFileNames.length })
    const prompt = `Analyze this video content collection and generate YouTube metadata:

FOLDER/COURSE NAME: "${folderName}"
CURRENT VIDEO FILE: "${currentFileName}"
RELATIVE PATH: "${relativePath}"

ALL FILES IN COLLECTION:
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Based on this analysis, please provide:

1. **Video Title**: Create an engaging YouTube title based ONLY on the current video filename (max 100 chars, YouTube optimized, do NOT include folder names or paths)
2. **Video Description**: Write a compelling description (2-3 paragraphs) explaining what this specific video covers
3. **Playlist Description**: Create an engaging playlist description for the entire collection
4. **Tags**: Generate 8-12 relevant YouTube tags
5. **Category**: Select most appropriate YouTube category ID from: 27(Education), 28(Science&Tech), 26(Howto&Style), 22(People&Blogs), 24(Entertainment), 19(Travel), 17(Sports), 15(Pets), 10(Music)
6. **Theme**: Identify the main theme/topic
7. **Target Audience**: Who is this content for?
8. **Skill Level**: beginner/intermediate/advanced

IMPORTANT GUIDELINES:
- For titles: Use ONLY the filename content, remove file extensions, clean up numbering/formatting but do NOT include folder names or paths
- Make titles engaging and clickable while staying professional
- Descriptions should be specific to the actual content, not generic
- Focus on value proposition and learning outcomes
- Use relevant keywords for YouTube SEO
- Be specific about what viewers will learn/gain
- Consider the video's position in the series context

Respond ONLY with valid JSON in this exact format:
{
  "videoTitle": "Your title here",
  "videoDescription": "Your description here...",
  "playlistDescription": "Your playlist description here...",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "27",
  "theme": "Main theme",
  "targetAudience": "Target audience",
  "skillLevel": "beginner/intermediate/advanced"
}`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert YouTube content strategist and SEO specialist. Analyze video content and create compelling, professional metadata that drives engagement and discoverability.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from DeepSeek API')
    }

    // Clean and parse JSON response - handle markdown code blocks
    let cleanContent = content.trim()
    
    // Remove markdown code block markers if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }
    
    const analysis = JSON.parse(cleanContent) as ContentAnalysis
    
    // Validate required fields
    if (!analysis.videoTitle || !analysis.videoDescription || !analysis.tags || !analysis.category) {
      throw new Error('Invalid response format from DeepSeek API')
    }

    return analysis

  } catch (error) {
    console.error('DeepSeek API error - falling back to basic analysis:', error)
    
    // Log specific error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if ('response' in error) {
        console.error('Response status:', (error as any).response?.status)
        console.error('Response data:', (error as any).response?.data)
      }
    }
    
    console.log('Generating fallback analysis for:', {
      folderName,
      currentFileName,
      fileCount: allFileNames.length
    })
    
    // Fallback to basic analysis if AI fails
    const fallback = generateFallbackAnalysis(folderName, allFileNames, currentFileName, relativePath)
    console.log('Fallback analysis generated:', {
      title: fallback.videoTitle,
      descriptionLength: fallback.videoDescription.length,
      descriptionPreview: fallback.videoDescription.substring(0, 100) + '...'
    })
    
    return fallback
  }
}

function generateFallbackAnalysis(
  folderName: string,
  allFileNames: string[],
  currentFileName: string,
  _relativePath: string
): ContentAnalysis {
  // Extract just the filename, removing any folder paths, extensions, and leading numbers
  let cleanFileName = currentFileName
    .replace(/^.*[\/\\]/, '') // Remove any folder path
    .replace(/\.[^/.]+$/, '') // Remove file extension
    .replace(/^\d+[\.\-_\s]*/, '') // Remove leading numbers and separators
    .trim()
  
  // If after cleaning we have nothing, use a default
  if (!cleanFileName) {
    cleanFileName = currentFileName.replace(/\.[^/.]+$/, '').trim() || 'Video Content'
  }
  
  const videoNumber = allFileNames.findIndex(name => name === currentFileName) + 1
  
  return {
    videoTitle: cleanFileName,
    videoDescription: `🎯 ${cleanFileName}\n\nPart ${videoNumber} of ${allFileNames.length} in the ${folderName} series.\n\n📚 Learn key concepts and practical strategies in this educational content.\n\n💡 Like and subscribe for more educational content!\n\n#education #learning #tutorial #guide`,
    playlistDescription: `${folderName} - Complete collection of ${allFileNames.length} educational videos covering essential topics and strategies.`,
    tags: ['education', 'learning', 'tutorial', 'guide', 'strategy'],
    category: '27',
    theme: 'Educational Content',
    targetAudience: 'Students and Professionals',
    skillLevel: 'intermediate'
  }
}

export async function analyzePlaylistContent(
  folderName: string,
  allFileNames: string[]
): Promise<{ description: string; theme: string }> {
  try {
    const prompt = `Analyze this video course/playlist and generate an engaging description:

COURSE/PLAYLIST NAME: "${folderName}"

VIDEO FILES:
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Create a compelling playlist description that:
- Explains what the course covers
- Highlights the value proposition
- Lists key learning outcomes
- Appeals to the target audience
- Is engaging and professional
- Uses relevant hashtags

Respond with JSON:
{
  "description": "Your playlist description here...",
  "theme": "Main theme/topic"
}`

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: 'You are an expert content marketer specializing in educational content and YouTube optimization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from DeepSeek API')
    }

    // Clean and parse JSON response - handle markdown code blocks  
    let cleanContent = content.trim()
    
    // Remove markdown code block markers if present
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/```\s*$/, '')
    } else if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/```\s*$/, '')
    }
    
    const result = JSON.parse(cleanContent)
    return {
      description: result.description || `${folderName} - Educational content collection`,
      theme: result.theme || 'Educational Content'
    }

  } catch (error) {
    console.error('DeepSeek playlist analysis error:', error)
    
    return {
      description: `${folderName} - Collection of ${allFileNames.length} educational videos covering key concepts and strategies.`,
      theme: 'Educational Content'
    }
  }
}