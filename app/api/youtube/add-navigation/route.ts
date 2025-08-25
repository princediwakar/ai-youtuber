import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { google } from 'googleapis'

interface VideoInfo {
  videoId: string
  title: string
  index: number
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { videos, playlistId } = await request.json()
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json({ error: 'No videos provided' }, { status: 400 })
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

    // Process each video to add navigation links
    for (let i = 0; i < videos.length; i++) {
      const currentVideo = videos[i] as VideoInfo
      
      try {
        // Get current video details
        const videoResponse = await youtube.videos.list({
          part: ['snippet'],
          id: [currentVideo.videoId]
        })

        if (!videoResponse.data.items?.[0]) {
          console.error(`Video ${currentVideo.videoId} not found`)
          continue
        }

        const currentVideoData = videoResponse.data.items[0]
        const originalDescription = currentVideoData.snippet?.description || ''

        // Generate navigation links
        const navigationLinks = generateNavigationLinks(videos, i, playlistId)
        
        // Add navigation links to description
        const updatedDescription = addNavigationToDescription(originalDescription, navigationLinks)

        // Update video description
        await youtube.videos.update({
          part: ['snippet'],
          requestBody: {
            id: currentVideo.videoId,
            snippet: {
              ...currentVideoData.snippet,
              description: updatedDescription
            }
          }
        })

        console.log(`Added navigation links to video: ${currentVideo.title}`)
        
      } catch (error) {
        console.error(`Failed to add navigation links to ${currentVideo.title}:`, error)
        // Continue with other videos even if one fails
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Navigation links error:', error)
    return NextResponse.json({ 
      error: 'Failed to add navigation links' 
    }, { status: 500 })
  }
}

function generateNavigationLinks(videos: VideoInfo[], currentIndex: number, playlistId: string): string {
  const currentVideo = videos[currentIndex]
  const prevVideo = currentIndex > 0 ? videos[currentIndex - 1] : null
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null
  
  let links = '\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  links += '🎬 PLAYLIST NAVIGATION\n'
  links += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
  
  // Current video info
  links += `📍 Current: ${currentVideo.title} (${currentIndex + 1}/${videos.length})\n\n`
  
  // Navigation links
  if (prevVideo) {
    links += `⬅️ Previous: ${prevVideo.title}\n`
    links += `   https://www.youtube.com/watch?v=${prevVideo.videoId}\n\n`
  }
  
  if (nextVideo) {
    links += `➡️ Next: ${nextVideo.title}\n`
    links += `   https://www.youtube.com/watch?v=${nextVideo.videoId}\n\n`
  }
  
  // Full playlist link
  if (playlistId) {
    links += `📋 Complete Playlist (${videos.length} videos):\n`
    links += `   https://www.youtube.com/playlist?list=${playlistId}\n\n`
  }
  
  // Quick jump links
  links += '🔢 QUICK JUMP TO:\n'
  videos.forEach((video, index) => {
    if (index !== currentIndex) {
      const prefix = index < currentIndex ? '✅' : '📹'
      links += `${prefix} ${index + 1}. ${video.title}: https://youtu.be/${video.videoId}\n`
    }
  })
  
  links += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'
  
  return links
}

function addNavigationToDescription(originalDescription: string, navigationLinks: string): string {
  // Remove any existing navigation section
  const existingNavStart = originalDescription.indexOf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (existingNavStart !== -1) {
    const existingNavEnd = originalDescription.lastIndexOf('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    if (existingNavEnd > existingNavStart) {
      originalDescription = originalDescription.slice(0, existingNavStart).trim()
    }
  }
  
  // Add navigation links at the end
  return originalDescription + navigationLinks
}