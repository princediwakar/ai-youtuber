import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { google } from 'googleapis'
import formidable from 'formidable'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'

// Disable body parser to handle file uploads
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for video uploads

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
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string
    const category = formData.get('category') as string
    const privacyStatus = formData.get('privacyStatus') as string || 'public'
    const playlistId = formData.get('playlistId') as string
    const position = formData.get('position') as string
    const madeForKids = formData.get('madeForKids') === 'true'

    console.log('Optimized upload request data:', {
      fileName: videoFile?.name,
      title,
      descriptionLength: description?.length,
      tagsCount: JSON.parse(tags || '[]').length,
      category,
      privacyStatus,
      playlistId,
      position
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

    // Parse tags
    let parsedTags: string[] = []
    try {
      parsedTags = JSON.parse(tags || '[]')
    } catch {
      parsedTags = []
    }

    console.log('Uploading with pre-processed metadata:', {
      title,
      descriptionLength: description.length,
      tagsCount: parsedTags.length,
      category,
      privacy: privacyStatus,
      madeForKids
    })

    // Convert File to buffer for upload
    const bytes = await videoFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create temporary file
    const filename = videoFile.name.split('/').pop() || videoFile.name
    const tempFilePath = `/tmp/${uuidv4()}-${filename}`
    fs.writeFileSync(tempFilePath, buffer)

    try {
      // Upload video to YouTube
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: title,
            description: description,
            tags: parsedTags,
            categoryId: category
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

      // Add to playlist if specified
      if (playlistId && videoId) {
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
    console.error('Optimized upload error:', error)
    
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
