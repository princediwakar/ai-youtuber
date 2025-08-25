import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { analyzeContent } from '../../../../lib/deepseek'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const {
      folderName,
      allFileNames,
      currentFileName,
      relativePath,
      titleFormat,
      customTitlePrefix,
      customTitleSuffix
    } = await request.json()

    console.log('🤖 Starting AI analysis for:', currentFileName)

    try {
      const aiAnalysis = await analyzeContent(
        folderName,
        allFileNames,
        currentFileName,
        relativePath
      )
      
      console.log('✅ AI analysis completed:', {
        title: aiAnalysis.videoTitle,
        descriptionLength: aiAnalysis.videoDescription.length,
        tagsCount: aiAnalysis.tags.length,
        category: aiAnalysis.category
      })
      
      // Generate final title based on format preference
      let finalTitle: string
      if (titleFormat === 'original') {
        finalTitle = cleanAIGeneratedTitle(aiAnalysis.videoTitle, currentFileName)
      } else {
        finalTitle = generateTitle(currentFileName, titleFormat, customTitlePrefix, customTitleSuffix)
      }

      return NextResponse.json({
        success: true,
        title: finalTitle,
        description: aiAnalysis.videoDescription,
        tags: aiAnalysis.tags,
        category: aiAnalysis.category
      })
      
    } catch (aiError) {
      console.error('AI analysis failed, using fallback:', aiError)
      
      // Fallback to basic metadata
      const finalTitle = generateTitle(currentFileName, titleFormat, customTitlePrefix, customTitleSuffix)
      const description = generateFallbackDescription(currentFileName, folderName, relativePath)
      const tags = generateBasicTags(currentFileName, folderName)
      const category = detectCategoryFromContent(folderName, allFileNames, relativePath)

      return NextResponse.json({
        success: true,
        title: finalTitle,
        description: description,
        tags: tags,
        category: category
      })
    }

  } catch (error) {
    console.error('Analyze video error:', error)
    return NextResponse.json({ 
      error: 'Analysis failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

function cleanAIGeneratedTitle(aiTitle: string, originalFileName: string): string {
  if (!aiTitle || aiTitle.trim() === '') {
    return generateTitle(originalFileName, 'original', '', '')
  }
  
  let cleaned = aiTitle
    .replace(/^.*[\/\\]/, '') // Remove everything before the last slash/backslash
    .replace(/\.[^/.]+$/, '') // Remove file extensions
    .trim()
  
  if (cleaned.includes('/')) {
    const parts = cleaned.split('/')
    cleaned = parts[parts.length - 1].trim()
  }
  
  cleaned = cleaned
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()
  
  if (cleaned.length > 100) {
    cleaned = cleaned.substring(0, 97) + '...'
  }
  
  return cleaned || generateTitle(originalFileName, 'original', '', '')
}

function generateTitle(filename: string, format: string, prefix: string, suffix: string): string {
  let baseTitle = filename.replace(/\.[^/.]+$/, '') // Remove extension
  
  switch (format) {
    case 'original':
      break
    case 'cleaned':
      baseTitle = baseTitle
        .replace(/^\d+[\.\-_\s]*/, '') // Remove leading numbers
        .replace(/[\-_]+/g, ' ') // Replace dashes/underscores with spaces
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim()
      break
    case 'custom':
      baseTitle = baseTitle
        .replace(/^\d+[\.\-_\s]*/, '')
        .replace(/[\-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      baseTitle = `${prefix}${baseTitle}${suffix}`
      break
  }
  
  let title = baseTitle
    .replace(/[<>]/g, '') // Remove angle brackets (not allowed)
    .replace(/\|/g, '-') // Replace pipes with dashes
    .trim()
  
  if (title.length > 100) {
    title = title.substring(0, 97) + '...'
  }
  
  return title || 'Untitled Video'
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

function detectCategoryFromContent(folderName: string, allFileNames: string[], relativePath: string): string {
  const allText = `${folderName} ${allFileNames.join(' ')} ${relativePath}`.toLowerCase()
  
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
  
  // Business/Professional indicators (People & Blogs - Category 22)
  const businessKeywords = [
    'business', 'entrepreneur', 'marketing', 'strategy', 'professional',
    'career', 'leadership', 'management', 'finance', 'sales', 'startup',
    'growth', 'success', 'productivity', 'networking'
  ]
  businessKeywords.forEach(keyword => {
    if (allText.includes(keyword)) categoryScores['22'] += 2
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
