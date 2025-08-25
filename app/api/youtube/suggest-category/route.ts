import { NextRequest, NextResponse } from 'next/server'
import { analyzeContent } from '../../../../lib/deepseek'

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

export async function POST(request: NextRequest) {
  try {
    const { folderName, fileNames, relativePaths } = await request.json()
    
    if (!fileNames || !Array.isArray(fileNames)) {
      return NextResponse.json({ error: 'File names are required' }, { status: 400 })
    }
    
    // Use DeepSeek AI for category analysis
    try {
      const aiAnalysis = await analyzeContent(
        folderName || '',
        fileNames,
        fileNames[0] || '',
        relativePaths?.join(' ') || ''
      )
      
      return NextResponse.json({ 
        suggestedCategory: aiAnalysis.category,
        success: true 
      })
    } catch (aiError) {
      console.error('DeepSeek analysis failed, falling back to pattern matching:', aiError)
      
      // Fallback to pattern matching
      const suggestedCategory = detectCategoryFromContent(
        folderName || '', 
        fileNames, 
        relativePaths?.join(' ') || ''
      )
      
      return NextResponse.json({ 
        suggestedCategory,
        success: true 
      })
    }
    
  } catch (error) {
    console.error('Category suggestion error:', error)
    return NextResponse.json({ 
      error: 'Failed to suggest category',
      suggestedCategory: '27' // Default to Education
    }, { status: 500 })
  }
}