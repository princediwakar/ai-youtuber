import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { google } from 'googleapis'
import formidable from 'formidable'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { analyzeContent } from '../../../../lib/deepseek'

// Disable body parser to handle file uploads
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video uploads

interface UploadData {
  title: string
  description: string
  contentType: string
  privacyStatus: string
  playlistId?: string
  position?: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const title = formData.get('title') as string
    const contentType = formData.get('contentType') as string || 'auto'
    const privacyStatus = formData.get('privacyStatus') as string || 'public'
    const playlistId = formData.get('playlistId') as string
    const position = formData.get('position') as string
    const uploadMode = formData.get('uploadMode') as string || 'playlist'
    const relativePath = formData.get('relativePath') as string || ''
    const folderStructure = formData.get('folderStructure') as string || ''
    const allFileNames = formData.get('allFileNames') as string || '[]'
    const folderName = formData.get('folderName') as string || ''
    
    // Advanced settings
    const madeForKids = formData.get('madeForKids') === 'false'
    const category = formData.get('category') as string || '27'
    const useAiAnalysis = formData.get('useAiAnalysis') === 'true'
    const titleFormat = formData.get('titleFormat') as string || 'original'
    const customTitlePrefix = formData.get('customTitlePrefix') as string || ''
    const customTitleSuffix = formData.get('customTitleSuffix') as string || ''
    const addPlaylistNavigation = formData.get('addPlaylistNavigation') === 'true'
    
    // YouTube Shorts detection
    const isShort = formData.get('isShort') === 'true'
    const duration = parseFloat(formData.get('duration') as string || '0')
    const aspectRatio = parseFloat(formData.get('aspectRatio') as string || '1.78')

    console.log('Upload request data:', {
      fileName: videoFile?.name,
      title,
      relativePath,
      folderStructure,
      useAiAnalysis,
      sessionExists: !!session,
      accessTokenExists: !!session?.accessToken
    })

    if (!videoFile || !title) {
      return NextResponse.json({ error: 'Missing video file or title' }, { status: 400 })
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: session.accessToken as string
    })

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client })

    // Title will be generated in the AI analysis section
    
    // Parse all file names for AI analysis
    let allFiles: string[] = []
    try {
      allFiles = JSON.parse(allFileNames)
    } catch {
      allFiles = [videoFile.name]
    }
    
    // AI Analysis Phase (blocking during upload)
    let finalTitle: string
    let description: string
    let tags: string[]
    let finalCategory = category
    
    if (useAiAnalysis) {
      console.log('🤖 Starting AI analysis for:', videoFile.name)
      try {
        const aiAnalysis = await analyzeContent(
          folderName,
          allFiles,
          videoFile.name,
          relativePath
        )
        
        console.log('✅ AI analysis completed:', {
          title: aiAnalysis.videoTitle,
          descriptionLength: aiAnalysis.videoDescription.length,
          tagsCount: aiAnalysis.tags.length,
          category: aiAnalysis.category
        })
        
        // Use AI-generated title based on format preference
        if (titleFormat === 'original') {
          finalTitle = cleanAIGeneratedTitle(aiAnalysis.videoTitle, videoFile.name)
        } else {
          finalTitle = generateTitle(videoFile.name, titleFormat, customTitlePrefix, customTitleSuffix)
        }
        
        description = aiAnalysis.videoDescription
        tags = aiAnalysis.tags
        finalCategory = aiAnalysis.category
        
      } catch (aiError) {
        console.error('AI analysis failed, using fallback:', aiError)
        // Fallback to basic metadata if AI fails
        finalTitle = generateTitle(videoFile.name, titleFormat, customTitlePrefix, customTitleSuffix)
        description = generateFallbackDescription(videoFile.name, folderName, relativePath)
        tags = generateBasicTags(videoFile.name, folderName)
        finalCategory = detectCategoryFromContent(folderName, allFiles, relativePath)
      }
    } else {
      // No AI analysis - use basic metadata
      finalTitle = generateTitle(videoFile.name, titleFormat, customTitlePrefix, customTitleSuffix)
      description = generateFallbackDescription(videoFile.name, folderName, relativePath)
      tags = generateBasicTags(videoFile.name, folderName)
      
      // Quick category detection (non-AI) if still default
      if (category === '27') {
        finalCategory = detectCategoryFromContent(folderName, allFiles, relativePath)
      }
    }
    
    // Optimize for YouTube Shorts
    if (isShort && duration <= 60 && aspectRatio <= 1.0) {
      description = generateShortsDescription(videoFile.name, description)
      tags = [...tags, 'shorts', 'short', 'vertical', 'mobile'].slice(0, 10)
      // Use Entertainment category for Shorts unless user explicitly chose a different category
      if (finalCategory === '27') {
        finalCategory = '24' // Entertainment category works well for Shorts
      }
    }
    
    console.log('Final metadata for upload:', {
      title: finalTitle,
      descriptionLength: description.length,
      tagsCount: tags.length,
      category: finalCategory,
      aiAnalysisUsed: useAiAnalysis
    })

    // Convert File to buffer for upload
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create temporary file - use only filename to avoid path issues
    const filename = videoFile.name.split('/').pop() || videoFile.name
    const tempFilePath = `/tmp/${uuidv4()}-${filename}`
    fs.writeFileSync(tempFilePath, buffer)

    try {
      console.log('Preparing YouTube upload with:', {
        title: finalTitle,
        descriptionLength: description?.length,
        tagsCount: tags?.length,
        category: finalCategory,
        privacy: privacyStatus,
        madeForKids
      })
      
      // Upload video to YouTube
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: finalTitle,
            description: description,
            tags: tags,
            categoryId: finalCategory
          },
          status: {
            privacyStatus: privacyStatus as 'private' | 'public' | 'unlisted',
            selfDeclaredMadeForKids: madeForKids
          }
        },
        media: {
          body: fs.createReadStream(tempFilePath)
        }
      })

      const videoId = response.data.id

      // Add to playlist if specified (only for playlist mode)
      if (uploadMode === 'playlist' && playlistId && videoId) {
        try {
          await youtube.playlistItems.insert({
            part: ['snippet'],
            requestBody: {
              snippet: {
                playlistId: playlistId,
                resourceId: {
                  kind: 'youtube#video',
                  videoId: videoId
                },
                position: position ? parseInt(position) : undefined
              }
            }
          })
        } catch (playlistError) {
          console.error('Error adding to playlist:', playlistError)
          // Continue even if playlist addition fails
        }
      }

      return NextResponse.json({
        success: true,
        videoId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`
      })

    } finally {
      // Clean up temporary file
      try {
        fs.unlinkSync(tempFilePath)
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError)
      }
    }

  } catch (error) {
    console.error('Upload error:', error)
    
    let errorMessage = 'Upload failed'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorDetails = error.message
      
      // Handle specific YouTube API errors
      if (error.message.includes('Invalid Credentials') || error.message.includes('unauthorized')) {
        errorMessage = 'Authentication failed'
        errorDetails = 'Your YouTube access token has expired. Please sign out and sign in again.'
      } else if (error.message.includes('quotaExceeded')) {
        errorMessage = 'Quota exceeded'
        errorDetails = 'YouTube API quota exceeded. Please try again later.'
      } else if (error.message.includes('forbidden')) {
        errorMessage = 'Permission denied'
        errorDetails = 'Insufficient permissions to upload videos. Please check your YouTube account permissions.'
      }
      
      // Log additional error details if available
      if ('response' in error) {
        console.error('YouTube API response:', (error as any).response?.data)
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage, 
      details: errorDetails 
    }, { status: 500 })
  }
}

function cleanTitle(title: string): string {
  if (!title || title.trim() === '') {
    return 'Untitled Video'
  }
  
  // Remove file extensions and clean up numbering
  let cleaned = title
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/^\d+[\.\-_]?\s*/, '') // Remove leading numbers
    .replace(/[\-_]+/g, ' ') // Replace dashes/underscores with spaces
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()
  
  // If cleaned title is empty, use original without extension
  if (!cleaned) {
    cleaned = title.replace(/\.[^/.]+$/, '').trim()
  }
  
  // Final fallback
  return cleaned || 'Untitled Video'
}

function cleanAIGeneratedTitle(aiTitle: string, originalFileName: string): string {
  if (!aiTitle || aiTitle.trim() === '') {
    return generateTitle(originalFileName, 'original', '', '')
  }
  
  // Remove any folder paths that might have been included by AI
  let cleaned = aiTitle
    .replace(/^.*[\/\\]/, '') // Remove everything before the last slash/backslash
    .replace(/\.[^/.]+$/, '') // Remove file extensions
    .trim()
  
  // If the AI title contains a forward slash, it might be a path - extract only the filename part
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/')
    cleaned = parts[parts.length - 1].trim()
  }
  
  // Apply YouTube title constraints
  cleaned = cleaned
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()
  
  // Ensure max length
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 97) + '...'
  }
  
  return cleaned || generateTitle(originalFileName, 'original', '', '')
}

function generateTitle(
  filename: string, 
  format: string, 
  prefix: string, 
  suffix: string
): string {
  let baseTitle = filename.replace(/\.[^/.]+$/, '') // Remove extension
  
  switch (format) {
    case 'original':
      // Use original filename as-is (minus extension)
      break
    case 'cleaned':
      // Clean up the filename
      baseTitle = baseTitle
        .replace(/^\d+[\.\-_\s]*/, '') // Remove leading numbers
        .replace(/[\-_]+/g, ' ') // Replace dashes/underscores with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
      break
    case 'custom':
      // Apply custom prefix and suffix
      if (format === 'custom') {
        // Clean the base title first
        baseTitle = baseTitle
          .replace(/^\d+[\.\-_\s]*/, '')
          .replace(/[\-_]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        baseTitle = `${prefix}${baseTitle}${suffix}`
      }
      break
  }
  
  // Apply YouTube constraints
  let title = baseTitle
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()
  
  // Ensure max length
  if (title.length > 100) {
    title = title.substring(0, 97) + '...'
  }
  
  return title || 'Untitled Video'
}

function cleanTitleForYoutube(filename: string): string {
  return generateTitle(filename, 'original', '', '')
}

async function analyzeContentWithAI(
  folderName: string, 
  allFileNames: string[], 
  currentFileName: string, 
  relativePath: string
): Promise<{ description: string; tags: string[]; suggestedCategory: string }> {
  try {
    // Create context for AI analysis
    const analysisPrompt = `
Analyze this video content based on the folder structure and file names:

FOLDER NAME: ${folderName}
RELATIVE PATH: ${relativePath}
CURRENT VIDEO FILE: ${currentFileName}

ALL FILES IN COLLECTION:
${allFileNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}

Based on this analysis, generate:
1. A compelling YouTube description (2-3 paragraphs) that explains what this specific video covers and how it fits into the overall content structure
2. 10-12 relevant tags for better discoverability

Consider:
- The topic/subject matter based on file names
- The sequence/order of content
- The educational value and target audience
- SEO-friendly keywords
- The specific focus of this video vs others in the collection

Respond in this exact JSON format:
{
  "description": "Your description here...",
  "tags": ["tag1", "tag2", "tag3", ...]
}
    `

    // Simple AI analysis using pattern matching and heuristics
    // In a production app, you'd call OpenAI API or similar
    const analysis = generateIntelligentContent(folderName, allFileNames, currentFileName, relativePath)
    
    return analysis
  } catch (error) {
    console.error('AI analysis failed:', error)
    // Fallback to basic analysis
    return {
      description: generateFallbackDescription(currentFileName, folderName, relativePath),
      tags: generateBasicTags(currentFileName, folderName),
      suggestedCategory: detectCategoryFromContent(folderName, [currentFileName], relativePath)
    }
  }
}

function generateIntelligentContent(
  folderName: string, 
  allFileNames: string[], 
  currentFileName: string, 
  relativePath: string
): { description: string; tags: string[]; suggestedCategory: string } {
  // Extract key information
  const currentIndex = allFileNames.findIndex(name => name === currentFileName)
  const totalVideos = allFileNames.length
  const videoNumber = currentIndex + 1
  
  // Analyze content theme
  const allText = `${folderName} ${allFileNames.join(' ')} ${relativePath}`.toLowerCase()
  const cleanCurrentName = currentFileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')
  const cleanFolderName = folderName.replace(/^\d+[\.\-_\s]*/, '').trim()
  
  // Extract meaningful keywords from file names
  const keywords = extractKeywords(allFileNames)
  
  // Advanced content analysis
  let contentTheme = ''
  let specificDescription = ''
  let specificTags: string[] = []
  let primaryTopic = 'education'
  
  // Growth Loop Analysis
  if (allText.includes('growth') && allText.includes('loop')) {
    contentTheme = 'Growth Loop Strategy'
    if (cleanCurrentName.toLowerCase().includes('fewer') || cleanCurrentName.toLowerCase().includes('better')) {
      specificDescription = 'Learn why focusing on fewer, better growth loops is more effective than trying to optimize everything at once. Discover the framework for identifying and prioritizing the growth loops that will have the biggest impact on your business.'
    } else if (cleanCurrentName.toLowerCase().includes('building') || cleanCurrentName.toLowerCase().includes('first')) {
      specificDescription = 'Master the fundamentals of building your first growth loop from scratch. Learn the essential components, common pitfalls, and proven strategies that successful companies use to create sustainable growth mechanisms.'
    } else {
      specificDescription = 'Understand the strategic approach to building sustainable growth loops that compound over time. Learn how to identify opportunities, design effective loops, and measure what matters.'
    }
    specificTags = ['growthhacking', 'businessstrategy', 'userretention', 'acquisition', 'scalablegrowth']
    primaryTopic = 'business'
  }
  // Retention Analysis
  else if (allText.includes('retention') || allText.includes('engagement')) {
    contentTheme = 'User Retention & Engagement'
    if (cleanCurrentName.toLowerCase().includes('top') || cleanCurrentName.toLowerCase().includes('%')) {
      specificDescription = 'Discover what separates the top-performing companies when it comes to user retention. Learn the specific metrics, strategies, and frameworks that drive exceptional retention rates.'
    } else {
      specificDescription = 'Learn data-driven strategies to increase user retention and build products that users can\'t stop using. Understand the psychology behind user engagement and retention.'
    }
    specificTags = ['userretention', 'productmetrics', 'engagement', 'churnreduction', 'productgrowth']
    primaryTopic = 'business'
  }
  // Programming/Tech Analysis
  else if (allText.includes('programming') || allText.includes('coding') || allText.includes('development')) {
    contentTheme = 'Programming & Development'
    specificDescription = 'Build your programming skills with practical, hands-on examples and real-world applications. Learn best practices, common patterns, and advanced techniques.'
    specificTags = ['programming', 'coding', 'development', 'softwareengineering', 'bestpractices']
    primaryTopic = 'tech'
  }
  // Business/Marketing Analysis
  else if (allText.includes('business') || allText.includes('marketing')) {
    contentTheme = 'Business Strategy'
    specificDescription = 'Learn proven business strategies and marketing tactics used by successful companies. Get actionable insights you can apply immediately.'
    specificTags = ['businessstrategy', 'marketing', 'entrepreneurship', 'startup', 'strategy']
    primaryTopic = 'business'
  }
  // Default educational content
  else {
    contentTheme = 'Educational Content'
    specificDescription = 'Comprehensive educational content designed to build your knowledge and skills step by step.'
    specificTags = ['education', 'learning', 'tutorial', 'guide', 'training']
    primaryTopic = 'education'
  }
  
  // Build description
  let description = `${cleanCurrentName}\n\n`
  
  // Add series context if multiple videos
  if (totalVideos > 1) {
    description += `📹 Part ${videoNumber} of ${totalVideos} • ${contentTheme}\n\n`
  }
  
  // Add section context
  if (relativePath && relativePath !== '') {
    const pathParts = relativePath.split('/').filter(p => p.length > 0)
    if (pathParts.length > 0) {
      const cleanPath = pathParts.map(part => part.replace(/^\d+[\.\-_\s]*/, '').trim()).join(' → ')
      description += `📂 MODULE: ${cleanPath}\n\n`
    }
  }
  
  // Add specific description
  description += `${specificDescription}\n\n`
  
  // Add specific learning outcomes based on content
  if (contentTheme.includes('Growth Loop')) {
    description += `🎯 YOU'LL LEARN:\n`
    description += `• How to identify high-impact growth opportunities\n`
    description += `• Framework for building sustainable growth loops\n`
    description += `• Common mistakes and how to avoid them\n`
    description += `• Metrics and measurement strategies\n\n`
  } else if (contentTheme.includes('Retention')) {
    description += `📊 YOU'LL LEARN:\n`
    description += `• Key retention metrics that matter most\n`
    description += `• Psychology of user engagement\n`
    description += `• Proven retention improvement strategies\n`
    description += `• How to measure and optimize retention\n\n`
  } else {
    description += `💡 KEY TAKEAWAYS:\n`
    description += `• Practical strategies you can implement today\n`
    description += `• Real-world examples and case studies\n`
    description += `• Step-by-step frameworks and methodologies\n\n`
  }
  
  // Add course context if it's part of a series
  if (cleanFolderName && totalVideos > 1) {
    description += `📚 COURSE: ${cleanFolderName}\n\n`
  }
  
  // Generate relevant hashtags based on content
  const relevantHashtags: string[] = []
  if (contentTheme.includes('Growth')) {
    relevantHashtags.push('#GrowthHacking', '#BusinessGrowth', '#StartupStrategy')
  } else if (contentTheme.includes('Retention')) {
    relevantHashtags.push('#UserRetention', '#ProductStrategy', '#Engagement')
  } else if (contentTheme.includes('Programming')) {
    relevantHashtags.push('#Programming', '#Coding', '#SoftwareDevelopment')
  } else {
    relevantHashtags.push('#Education', '#Learning', '#Professional')
  }
  
  description += relevantHashtags.join(' ')
  
  // Generate comprehensive tags (remove duplicates)
  const baseTags = specificTags.slice(0, 6) // Use specific tags as base
  const keywordTags = keywords.slice(0, 3)
  const allTags = [...new Set([...baseTags, ...keywordTags, primaryTopic])].slice(0, 10)
  
  // Detect the most appropriate YouTube category
  const suggestedCategory = detectCategoryFromContent(folderName, allFileNames, relativePath)
  
  return {
    description,
    tags: allTags,
    suggestedCategory
  }
}

function extractKeywords(fileNames: string[]): string[] {
  const allText = fileNames.join(' ').toLowerCase()
  const commonWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'video', 'mp4', 'mov', 'avi']
  
  const words = allText
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .filter(word => !/^\d+$/.test(word)) // Remove pure numbers
  
  // Count frequency and return most common
  const frequency: { [key: string]: number } = {}
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1
  })
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word)
}

function generateBasicUploadDescription(fileName: string, folderName: string, relativePath: string, position?: string): string {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')
  const videoNumber = position ? parseInt(position) + 1 : null
  
  let description = `${cleanName}\n\n`
  
  if (videoNumber && folderName) {
    description += `📹 Part ${videoNumber} of series: ${folderName}\n\n`
  } else if (folderName) {
    description += `📚 Part of: ${folderName}\n\n`
  }
  
  if (relativePath && relativePath !== '') {
    const pathParts = relativePath.split('/').filter(p => p.length > 0)
    if (pathParts.length > 0) {
      const cleanPath = pathParts.map(part => part.replace(/^\d+[\.\-_\s]*/, '').trim()).join(' → ')
      description += `📂 MODULE: ${cleanPath}\n\n`
    }
  }
  
  description += `🎯 High-quality educational content designed for learning and professional development.\n\n`
  description += `💡 Like and subscribe for more educational content!\n`
  description += `💬 Share your thoughts and questions in the comments below.\n\n`
  description += `✨ This video will be enhanced with AI-powered descriptions and insights shortly...\n\n`
  description += `#education #learning #content #tutorial #guide`
  
  return description
}

function generateFallbackDescription(fileName: string, folderName: string, relativePath: string): string {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')
  
  let description = `🎯 ${cleanName}\n\n`
  description += `📚 Quality educational content designed to provide valuable insights and learning opportunities.\n\n`
  
  if (folderName) {
    description += `📂 COLLECTION: ${folderName}\n\n`
  }
  
  description += `💡 Like and subscribe for more educational content!\n`
  description += `💬 Share your thoughts and questions in the comments below.\n\n`
  description += `#education #learning #content #tutorial #guide`
  
  return description
}

function generateShortsDescription(fileName: string, originalDescription: string): string {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/^\d+[\.\-_\s]*/, '')
  
  // Create a short, engaging description optimized for Shorts
  let description = `🔥 ${cleanName}\n\n`
  description += `📱 Quick tip in 60 seconds or less!\n\n`
  description += `💡 Follow for more bite-sized content!\n`
  description += `👍 Like if this helped you!\n`
  description += `💬 What do you think? Comment below!\n\n`
  description += `#Shorts #QuickTip #Viral #Mobile #Short`
  
  return description
}

function generateBasicTags(fileName: string, folderName: string): string[] {
  const text = `${fileName} ${folderName}`.toLowerCase()
  const baseTags = ['education', 'learning', 'tutorial', 'guide', 'content']
  
  const specificTags = []
  if (text.includes('business')) specificTags.push('business', 'professional')
  if (text.includes('tech')) specificTags.push('technology', 'programming')
  if (text.includes('course')) specificTags.push('course', 'training')
  if (text.includes('beginner')) specificTags.push('beginner', 'basics')
  if (text.includes('advanced')) specificTags.push('advanced', 'expert')
  
  return [...baseTags, ...specificTags].slice(0, 10)
}

function extractVideoNumber(title: string): string | null {
  const match = title.match(/^\d+/)
  return match ? match[0] : null
}

function detectCategoryFromContent(
  folderName: string, 
  allFileNames: string[], 
  relativePath: string
): string {
  // Combine all text for analysis
  const allText = `${folderName} ${allFileNames.join(' ')} ${relativePath}`.toLowerCase()
  
  // Category scoring system
  const categoryScores: { [key: string]: number } = {
    '27': 0, // Education
    '28': 0, // Science & Technology
    '26': 0, // Howto & Style
    '22': 0, // People & Blogs
    '24': 0, // Entertainment
    '25': 0, // News & Politics
    '19': 0, // Travel & Events
    '17': 0, // Sports
    '15': 0, // Pets & Animals
    '10': 0, // Music
  }
  
  // Education indicators (Category 27)
  const educationKeywords = [
    'course', 'lesson', 'tutorial', 'learn', 'education', 'training', 'class', 
    'lecture', 'study', 'teach', 'instruction', 'academy', 'school', 'university',
    'guide', 'howto', 'beginner', 'advanced', 'basics', 'fundamentals'
  ]
  educationKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['27'] += 2
  })
  
  // Science & Technology indicators (Category 28)
  const techKeywords = [
    'programming', 'coding', 'software', 'development', 'tech', 'technology',
    'computer', 'algorithm', 'data', 'science', 'engineering', 'ai', 'ml',
    'javascript', 'python', 'react', 'node', 'web', 'app', 'api', 'database'
  ]
  techKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['28'] += 3
  })
  
  // Howto & Style indicators (Category 26)
  const howtoKeywords = [
    'how to', 'howto', 'diy', 'tutorial', 'tips', 'tricks', 'style', 'fashion',
    'beauty', 'makeup', 'hair', 'design', 'creative', 'craft', 'art'
  ]
  howtoKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['26'] += 2
  })
  
  // Business/Professional indicators (People & Blogs - Category 22)
  const businessKeywords = [
    'business', 'entrepreneur', 'marketing', 'strategy', 'professional',
    'career', 'leadership', 'management', 'finance', 'sales', 'startup',
    'growth', 'success', 'productivity', 'networking'
  ]
  businessKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['22'] += 2
  })
  
  // Entertainment indicators (Category 24)
  const entertainmentKeywords = [
    'entertainment', 'funny', 'comedy', 'fun', 'viral', 'meme', 'reaction',
    'review', 'movie', 'show', 'series', 'celebrity', 'gossip'
  ]
  entertainmentKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['24'] += 2
  })
  
  // Health & Fitness (falls under Howto & Style - Category 26)
  const healthKeywords = [
    'health', 'fitness', 'workout', 'exercise', 'nutrition', 'diet',
    'wellness', 'yoga', 'meditation', 'mental health', 'lifestyle'
  ]
  healthKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['26'] += 1
  })
  
  // Music indicators (Category 10)
  const musicKeywords = [
    'music', 'song', 'audio', 'sound', 'beat', 'melody', 'instrument',
    'guitar', 'piano', 'vocals', 'recording', 'studio', 'band', 'album'
  ]
  musicKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['10'] += 3
  })
  
  // Travel indicators (Category 19)
  const travelKeywords = [
    'travel', 'trip', 'vacation', 'journey', 'destination', 'adventure',
    'explore', 'culture', 'country', 'city', 'tourism', 'hotel', 'flight'
  ]
  travelKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['19'] += 3
  })
  
  // Sports indicators (Category 17)
  const sportsKeywords = [
    'sport', 'sports', 'game', 'match', 'competition', 'team', 'player',
    'football', 'basketball', 'soccer', 'tennis', 'baseball', 'hockey'
  ]
  sportsKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['17'] += 3
  })
  
  // Special case: If it contains retention/engagement/analytics, likely business content
  if (allText.includes('retention') || allText.includes('engagement') || allText.includes('analytics')) {
    categoryScores['22'] += 3 // People & Blogs for business content
  }
  
  // If no clear category detected, default to Education
  const maxScore = Math.max(...Object.values(categoryScores))
  if (maxScore === 0) {
    return '27' // Default to Education
  }
  
  // Return the category with the highest score
  const bestCategory = Object.entries(categoryScores)
    .find(([, score]) => score === maxScore)?.[0] || '27'
  
  return bestCategory
}

