'use client'

import { useState, useCallback, useEffect } from 'react'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Upload, Youtube, FolderOpen, User, LogOut, CheckCircle, AlertCircle, Clock, FileVideo, Play, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import Link from 'next/link'

interface VideoFile {
  file: File
  name: string
  size: string
  path: string
  relativePath: string
  folder: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  videoId?: string
  error?: string
  thumbnail?: string
  isShort?: boolean
  duration?: number
  aspectRatio?: number
}

interface UploadSettings {
  playlistName: string
  privacyStatus: 'private' | 'unlisted' | 'public'
  maxVideos: number
  contentType: string
  // Upload mode
  uploadMode: 'playlist' | 'individual'
  // Advanced settings
  madeForKids: boolean
  category: string
  useAiAnalysis: boolean
  titleFormat: 'original' | 'cleaned' | 'custom'
  customTitlePrefix: string
  customTitleSuffix: string
  addPlaylistNavigation: boolean
  // Playlist selection
  useExistingPlaylist: boolean
  selectedPlaylistId: string
}

interface PlaylistItem {
  id: string
  snippet: {
    title: string
    description?: string
    publishedAt: string
  }
  contentDetails: {
    itemCount: number
  }
}

export default function HomePage() {
  const { data: session, status } = useSession()
  const [videos, setVideos] = useState<VideoFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [currentUpload, setCurrentUpload] = useState<string | null>(null)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null)
  const [uploadSettings, setUploadSettings] = useState<UploadSettings>({
    playlistName: '',
    privacyStatus: 'public',
    maxVideos: 10,
    contentType: 'auto',
    // Upload mode
    uploadMode: 'playlist',
    // Advanced settings
    madeForKids: false,
    category: '27', // Education
    useAiAnalysis: true,
    titleFormat: 'original',
    customTitlePrefix: '',
    customTitleSuffix: '',
    addPlaylistNavigation: true,
    // Playlist selection
    useExistingPlaylist: false,
    selectedPlaylistId: ''
  })
  
  // AI Processing status
  const [aiProcessing, setAiProcessing] = useState({
    categoryAnalysis: false,
    playlistAnalysis: false,
    videoAnalysis: false,
    currentVideoAnalysis: null as string | null,
    addingNavigation: false
  })
  
  // Playlist management with caching
  const [availablePlaylists, setAvailablePlaylists] = useState<PlaylistItem[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(false)
  
  // Cache management
  const PLAYLIST_CACHE_KEY = 'youtube_playlists_cache'
  const PLAYLIST_CACHE_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds
  const PLAYLIST_VIDEOS_CACHE_KEY = 'youtube_playlist_videos_cache'
  const PLAYLIST_VIDEOS_CACHE_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

  // Optimized upload flow state
  const [preProcessingStatus, setPreProcessingStatus] = useState({
    isPreProcessing: false,
    currentStep: '',
    progress: 0,
    totalSteps: 0
  })

  const [uploadQueue, setUploadQueue] = useState<Array<{
    video: VideoFile
    metadata: {
      title: string
      description: string
      tags: string[]
      category: string
    }
    position: number
  }>>([])

  // Load cached playlists on component mount if available
  useEffect(() => {
    if (session?.accessToken && availablePlaylists.length === 0 && !loadingPlaylists) {
      const cached = getCachedPlaylists()
      if (cached) {
        setAvailablePlaylists(cached.playlists)
        console.log('Loaded playlists from cache on mount')
      }
    }
  }, [session?.accessToken])

  // State for existing playlist videos (for duplicate checking)
  const [existingPlaylistVideos, setExistingPlaylistVideos] = useState<Array<{
    videoId: string
    title: string
    position: number
  }>>([])
  const [loadingExistingVideos, setLoadingExistingVideos] = useState(false)

  // Cache utility functions
  const getCachedPlaylists = (): { playlists: PlaylistItem[], timestamp: number } | null => {
    try {
      const cached = localStorage.getItem(PLAYLIST_CACHE_KEY)
      if (!cached) return null
      
      const parsed = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is still valid
      if (now - parsed.timestamp < PLAYLIST_CACHE_DURATION) {
        console.log('Using cached playlists (age:', Math.round((now - parsed.timestamp) / 1000 / 60), 'minutes)')
        return parsed
      } else {
        console.log('Playlist cache expired, will fetch fresh data')
        localStorage.removeItem(PLAYLIST_CACHE_KEY)
        return null
      }
    } catch (error) {
      console.error('Error reading playlist cache:', error)
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
      return null
    }
  }

  const setCachedPlaylists = (playlists: PlaylistItem[]) => {
    try {
      const cacheData = {
        playlists,
        timestamp: Date.now()
      }
      localStorage.setItem(PLAYLIST_CACHE_KEY, JSON.stringify(cacheData))
      console.log('Playlists cached successfully')
    } catch (error) {
      console.error('Error caching playlists:', error)
    }
  }

  const clearPlaylistCache = () => {
    try {
      localStorage.removeItem(PLAYLIST_CACHE_KEY)
      console.log('Playlist cache cleared')
    } catch (error) {
      console.error('Error clearing playlist cache:', error)
    }
  }

  // Playlist videos cache utility functions
  const getCachedPlaylistVideos = (playlistId: string): { videos: any[], timestamp: number } | null => {
    try {
      const cacheKey = `${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return null
      
      const parsed = JSON.parse(cached)
      const now = Date.now()
      
      // Check if cache is still valid
      if (now - parsed.timestamp < PLAYLIST_VIDEOS_CACHE_DURATION) {
        console.log('Using cached playlist videos for', playlistId, '(age:', Math.round((now - parsed.timestamp) / 1000 / 60), 'minutes)')
        return parsed
      } else {
        console.log('Playlist videos cache expired for', playlistId, ', will fetch fresh data')
        localStorage.removeItem(cacheKey)
        return null
      }
    } catch (error) {
      console.error('Error reading playlist videos cache:', error)
      localStorage.removeItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`)
      return null
    }
  }

  const setCachedPlaylistVideos = (playlistId: string, videos: any[]) => {
    try {
      const cacheKey = `${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`
      const cacheData = {
        videos,
        timestamp: Date.now()
      }
      localStorage.setItem(cacheKey, JSON.stringify(cacheData))
      console.log('Playlist videos cached successfully for', playlistId)
    } catch (error) {
      console.error('Error caching playlist videos:', error)
    }
  }

  const clearPlaylistVideosCache = (playlistId?: string) => {
    try {
      if (playlistId) {
        // Clear specific playlist cache
        localStorage.removeItem(`${PLAYLIST_VIDEOS_CACHE_KEY}_${playlistId}`)
        console.log('Playlist videos cache cleared for', playlistId)
      } else {
        // Clear all playlist videos cache
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
          if (key.startsWith(PLAYLIST_VIDEOS_CACHE_KEY)) {
            localStorage.removeItem(key)
          }
        })
        console.log('All playlist videos cache cleared')
      }
    } catch (error) {
      console.error('Error clearing playlist videos cache:', error)
    }
  }

  const fetchUserPlaylists = async (forceRefresh = false) => {
    if (!session?.accessToken) return
    
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = getCachedPlaylists()
      if (cached) {
        setAvailablePlaylists(cached.playlists)
        return
      }
    }
    
    try {
      setLoadingPlaylists(true)
      console.log('Fetching user playlists...')
      
      const response = await fetch('/api/youtube/playlist', {
        method: 'GET'
      })
      
      console.log('Playlist response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Playlist data received:', {
          success: data.success,
          playlistsCount: data.playlists?.length,
          playlists: data.playlists?.map((p: any) => ({ id: p.id, title: p.snippet?.title })),
          isMockData: data.isMockData
        })
        
        const playlists = data.playlists || []
        setAvailablePlaylists(playlists)
        
        // Cache the playlists (only if not mock data)
        if (!data.isMockData) {
          setCachedPlaylists(playlists)
        }
        
        // Show notification if using mock data
        if (data.isMockData) {
          alert('⚠️ Using mock playlist data due to YouTube API quota exceeded. This is for development purposes only.')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Failed to fetch playlists:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        })
        
        // Show user-friendly error message for quota issues
        if (response.status === 429 || (errorData.error && errorData.error.includes('quota'))) {
          alert('YouTube API quota exceeded. Please try again tomorrow or request a quota increase from Google Cloud Console.')
        } else if (response.status === 401) {
          alert('Authentication expired. Please sign out and sign in again.')
        } else {
          alert(`Failed to fetch playlists: ${errorData.details || errorData.error || 'Unknown error'}`)
        }
      }
    } catch (error) {
      console.error('Error fetching playlists:', error)
    } finally {
      setLoadingPlaylists(false)
    }
  }

  const fetchExistingPlaylistVideos = async (playlistId: string, forceRefresh = false) => {
    if (!session?.accessToken) return
    
    // Check cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cached = getCachedPlaylistVideos(playlistId)
      if (cached) {
        setExistingPlaylistVideos(cached.videos)
        return
      }
    }
    
    try {
      setLoadingExistingVideos(true)
      const response = await fetch(`/api/youtube/playlist-videos?playlistId=${playlistId}`, {
        method: 'GET'
      })
      
      if (response.ok) {
        const data = await response.json()
        const videos = data.videos || []
        setExistingPlaylistVideos(videos)
        
        // Cache the playlist videos
        setCachedPlaylistVideos(playlistId, videos)
      } else {
        console.error('Failed to fetch existing playlist videos')
        setExistingPlaylistVideos([])
      }
    } catch (error) {
      console.error('Error fetching existing playlist videos:', error)
      setExistingPlaylistVideos([])
    } finally {
      setLoadingExistingVideos(false)
    }
  }

  const generateTitle = (filename: string, format: string, prefix: string, suffix: string): string => {
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
        baseTitle = baseTitle
          .replace(/^\d+[\.\-_\s]*/, '')
          .replace(/[\-_]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
        baseTitle = `${prefix}${baseTitle}${suffix}`
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

  const generateFallbackDescription = (filename: string, folder: string, relativePath: string): string => {
    const baseFilename = filename.replace(/\.[^/.]+$/, '')
    let description = `Video: ${baseFilename}`
    
    if (folder) {
      description += `\nFrom: ${folder}`
    }
    
    if (relativePath && relativePath !== filename) {
      description += `\nPath: ${relativePath}`
    }
    
    return description
  }

  const generateBasicTags = (filename: string, folder: string): string[] => {
    const tags: string[] = []
    
    // Add filename-based tags
    const baseFilename = filename.replace(/\.[^/.]+$/, '')
    const words = baseFilename
      .replace(/[\-_]+/g, ' ')
      .replace(/^\d+[\.\-_\s]*/, '')
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
    
    tags.push(...words.slice(0, 5)) // Take first 5 meaningful words
    
    // Add folder-based tag if available
    if (folder) {
      tags.push(folder.toLowerCase())
    }
    
    return tags.filter(tag => tag.length > 2).slice(0, 10) // Max 10 tags
  }

  const checkForDuplicateVideos = (videos: VideoFile[], existingVideos: Array<{videoId: string, title: string, position: number}>): VideoFile[] => {
    if (existingVideos.length === 0) return videos
    
    return videos.filter(video => {
      const videoTitle = generateTitle(video.file.name, uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix)
      
      // Check for exact title match
      const isDuplicate = existingVideos.some(existing => {
        const existingTitle = existing.title.trim()
        const newTitle = videoTitle.trim()
        return existingTitle.toLowerCase() === newTitle.toLowerCase()
      })
      
      if (isDuplicate) {
        console.log(`Skipping duplicate video: ${videoTitle}`)
      }
      
      return !isDuplicate
    })
  }

  const generatePlaylistDescription = async (videos: VideoFile[]) => {
    const folderName = videos.length > 0 ? videos[0].folder : ''
    const fileNames = videos.map(v => v.file.name)
    
    // Use AI for playlist description if enabled
    if (uploadSettings.useAiAnalysis) {
      try {
        setAiProcessing(prev => ({ ...prev, playlistAnalysis: true }))
        
        const response = await fetch('/api/youtube/analyze-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folderName,
            fileNames
          })
        })
        
        if (response.ok) {
          const { description } = await response.json()
          setAiProcessing(prev => ({ ...prev, playlistAnalysis: false }))
          return description
        }
      } catch (error) {
        console.error('Failed to get AI playlist description:', error)
        setAiProcessing(prev => ({ ...prev, playlistAnalysis: false }))
      }
    }
    
    // Fallback to basic description
    const cleanFolderName = folderName.replace(/^\d+[\.\-_\s]*/, '').trim()
    return `🎯 ${cleanFolderName || 'Complete Course'}

Collection of ${videos.length} educational videos covering key concepts and strategies.

📚 WHAT'S INCLUDED:
${videos.slice(0, 5).map((v, i) => `${i + 1}. ${v.name.replace(/^\d+[\.\-_\s]*/, '').replace(/\.[^/.]+$/, '')}`).join('\n')}${videos.length > 5 ? `\n...and ${videos.length - 5} more videos` : ''}

💡 PERFECT FOR: Professionals and students looking to expand their knowledge

🔥 WATCH IN ORDER for the best learning experience

#Education #Learning #Professional`
  }

  const suggestCategory = async (videos: VideoFile[]) => {
    try {
      setAiProcessing(prev => ({ ...prev, categoryAnalysis: true }))
      
      const fileNames = videos.map(v => v.file.name)
      const folderName = videos.length > 0 ? videos[0].folder : ''
      const relativePaths = videos.map(v => v.relativePath)

      const response = await fetch('/api/youtube/suggest-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folderName,
          fileNames,
          relativePaths
        })
      })

      if (response.ok) {
        const { suggestedCategory } = await response.json()
        if (suggestedCategory && suggestedCategory !== '27') {
          setUploadSettings(prev => ({ ...prev, category: suggestedCategory }))
        }
      }
      
      setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
    } catch (error) {
      console.error('Failed to get category suggestion:', error)
      setAiProcessing(prev => ({ ...prev, categoryAnalysis: false }))
    }
  }

  const analyzeVideo = (file: File): Promise<{
    thumbnail: string
    isShort: boolean
    duration: number
    aspectRatio: number
  }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      
      video.preload = 'metadata'
      video.onloadedmetadata = () => {
        // Set canvas size
        canvas.width = 160
        canvas.height = 90
        
        // Seek to 10% of video duration for a representative frame
        video.currentTime = Math.min(video.duration * 0.1, 2)
      }
      
      video.oncanplay = () => {
        // Draw video frame to canvas
        context?.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert to data URL
        const thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        
        // Calculate aspect ratio
        const aspectRatio = video.videoWidth / video.videoHeight
        
        // Detect if it's a Short:
        // - Duration <= 60 seconds
        // - Vertical or square aspect ratio (≤ 1.0)
        const isShort = video.duration <= 60 && aspectRatio <= 1.0
        
        resolve({
          thumbnail,
          isShort,
          duration: video.duration,
          aspectRatio
        })
        
        // Clean up
        URL.revokeObjectURL(video.src)
      }
      
      video.onerror = () => {
        // Return defaults if analysis fails
        resolve({
          thumbnail: '',
          isShort: false,
          duration: 0,
          aspectRatio: 16/9
        })
        URL.revokeObjectURL(video.src)
      }
      
      video.src = URL.createObjectURL(file)
    })
  }

  const generateVideoThumbnail = (file: File): Promise<string> => {
    return analyzeVideo(file).then(result => result.thumbnail)
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newVideos: VideoFile[] = []
    
    acceptedFiles.forEach(file => {
      // Check if it's a video file
      if (file.type.startsWith('video/') || 
          file.name.match(/\.(mp4|avi|mov|mkv|flv|wmv|webm|m4v)$/i)) {
        
        // Extract path information
        const fullPath = (file as any).webkitRelativePath || file.name
        const pathParts = fullPath.split('/')
        const fileName = pathParts[pathParts.length - 1]
        const folderPath = pathParts.slice(0, -1).join('/')
        const rootFolder = pathParts[0] || 'Root'
        
        newVideos.push({
          file,
          name: fileName.replace(/\.[^/.]+$/, ''), // Remove extension
          size: formatFileSize(file.size),
          path: fullPath,
          relativePath: folderPath,
          folder: rootFolder,
          status: 'pending',
          progress: 0
        })
      }
    })

    // Sort videos by path for logical order
    newVideos.sort((a, b) => a.path.localeCompare(b.path))
    setVideos(newVideos)
    
    // Analyze each video (thumbnails + Short detection)
    newVideos.forEach(async (video, index) => {
      try {
        const analysis = await analyzeVideo(video.file)
        setVideos(prevVideos => 
          prevVideos.map((v, i) => 
            i === index ? { 
              ...v, 
              thumbnail: analysis.thumbnail,
              isShort: analysis.isShort,
              duration: analysis.duration,
              aspectRatio: analysis.aspectRatio
            } : v
          )
        )
      } catch (error) {
        console.error(`Failed to analyze video ${video.name}:`, error)
      }
    })
    
    // Clear previous playlist ID when new videos are selected
    setCurrentPlaylistId(null)

    // Auto-generate playlist name from folder structure
    if (newVideos.length > 0 && !uploadSettings.playlistName) {
      const rootFolder = newVideos[0].folder
      const playlistName = rootFolder !== 'Root' ? rootFolder : extractPlaylistName(newVideos[0].name)
      setUploadSettings(prev => ({ ...prev, playlistName }))
    }

    // Auto-detect if we should suggest individual upload mode for Shorts
    setTimeout(() => {
      const shortVideos = newVideos.filter(v => v.isShort).length
      if (shortVideos > 0 && shortVideos === newVideos.length) {
        // All videos are Shorts, suggest individual upload
        setUploadSettings(prev => ({ ...prev, uploadMode: 'individual' }))
      }
    }, 2000) // Give time for video analysis to complete

    // Category suggestion will happen when upload starts, not when files are selected
  }, [uploadSettings.playlistName, uploadSettings.category])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.flv', '.wmv', '.webm', '.m4v']
    },
    multiple: true
  })

  // Handle folder selection
  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    onDrop(files)
  }

  // Pre-process all videos before upload
  const preProcessVideos = async (videos: VideoFile[]): Promise<Array<{
    video: VideoFile
    metadata: {
      title: string
      description: string
      tags: string[]
      category: string
    }
  }>> => {
    const totalSteps = videos.length + 2 // +2 for category suggestion and playlist description
    let currentStep = 0
    
    setPreProcessingStatus({
      isPreProcessing: true,
      currentStep: 'Starting pre-processing...',
      progress: 0,
      totalSteps
    })

    const processedVideos: Array<{
      video: VideoFile
      metadata: {
        title: string
        description: string
        tags: string[]
        category: string
      }
    }> = []

    try {
      // Step 1: Category suggestion (once for all videos)
      if (uploadSettings.category === '27' && !uploadSettings.useExistingPlaylist) {
        setPreProcessingStatus(prev => ({
          ...prev,
          currentStep: 'Analyzing content for category suggestion...',
          progress: (currentStep / totalSteps) * 100
        }))
        
        await suggestCategory(videos)
        currentStep++
      }

      // Step 2: Process each video in parallel (with concurrency limit)
      const concurrencyLimit = 3
      const chunks = []
      for (let i = 0; i < videos.length; i += concurrencyLimit) {
        chunks.push(videos.slice(i, i + concurrencyLimit))
      }

      for (const chunk of chunks) {
        const chunkPromises = chunk.map(async (video) => {
          setPreProcessingStatus(prev => ({
            ...prev,
            currentStep: `Processing metadata for: ${video.name}`,
            progress: (currentStep / totalSteps) * 100
          }))

          try {
            let metadata: {
              title: string
              description: string
              tags: string[]
              category: string
            }

            if (uploadSettings.useAiAnalysis) {
              // AI analysis for this video
              const allFileNames = videos.map(v => v.file.name)
              const response = await fetch('/api/youtube/analyze-video', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  folderName: videos.length > 0 ? videos[0].folder : '',
                  allFileNames,
                  currentFileName: video.file.name,
                  relativePath: video.relativePath,
                  titleFormat: uploadSettings.titleFormat,
                  customTitlePrefix: uploadSettings.customTitlePrefix,
                  customTitleSuffix: uploadSettings.customTitleSuffix
                })
              })

              if (response.ok) {
                const aiResult = await response.json()
                metadata = {
                  title: aiResult.title,
                  description: aiResult.description,
                  tags: aiResult.tags,
                  category: aiResult.category
                }
              } else {
                throw new Error('AI analysis failed')
              }
            } else {
              // Basic metadata generation
              metadata = {
                title: generateTitle(video.file.name, uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix),
                description: generateFallbackDescription(video.file.name, videos.length > 0 ? videos[0].folder : '', video.relativePath),
                tags: generateBasicTags(video.file.name, videos.length > 0 ? videos[0].folder : ''),
                category: uploadSettings.category
              }
            }

            return { video, metadata }
          } catch (error) {
            console.error(`Failed to process ${video.name}:`, error)
            // Return fallback metadata
            return {
              video,
              metadata: {
                title: generateTitle(video.file.name, uploadSettings.titleFormat, uploadSettings.customTitlePrefix, uploadSettings.customTitleSuffix),
                description: generateFallbackDescription(video.file.name, videos.length > 0 ? videos[0].folder : '', video.relativePath),
                tags: generateBasicTags(video.file.name, videos.length > 0 ? videos[0].folder : ''),
                category: uploadSettings.category
              }
            }
          }
        })

        const chunkResults = await Promise.all(chunkPromises)
        processedVideos.push(...chunkResults)
        currentStep += chunk.length

        setPreProcessingStatus(prev => ({
          ...prev,
          progress: (currentStep / totalSteps) * 100
        }))
      }

      setPreProcessingStatus(prev => ({
        ...prev,
        currentStep: 'Pre-processing completed!',
        progress: 100
      }))

      return processedVideos
    } catch (error) {
      console.error('Pre-processing failed:', error)
      throw error
    } finally {
      setPreProcessingStatus({
        isPreProcessing: false,
        currentStep: '',
        progress: 0,
        totalSteps: 0
      })
    }
  }

  // Optimized upload function
  const handleOptimizedUpload = async () => {
    if (!session) return

    setIsUploading(true)
    
    try {
      // Phase 1: Pre-processing
      const videosToProcess = videos.slice(0, uploadSettings.maxVideos)
      const processedVideos = await preProcessVideos(videosToProcess)
      
      // Phase 2: Playlist management (only for playlist mode)
      let playlistId: string | null = null
      let existingVideos: Array<{videoId: string, title: string, position: number}> = []
      
      if (uploadSettings.uploadMode === 'playlist') {
        if (uploadSettings.useExistingPlaylist) {
          if (!uploadSettings.selectedPlaylistId) {
            throw new Error('Please select an existing playlist')
          }
          playlistId = uploadSettings.selectedPlaylistId
          setCurrentPlaylistId(playlistId)
          
          // Fetch existing videos for duplicate detection
          await fetchExistingPlaylistVideos(playlistId)
          existingVideos = existingPlaylistVideos
        } else {
          if (!uploadSettings.playlistName) {
            throw new Error('Please enter a playlist name')
          }
          
          const playlistDescription = await generatePlaylistDescription(videos)
          const playlistResponse = await fetch('/api/youtube/playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: uploadSettings.playlistName,
              description: playlistDescription,
              privacyStatus: uploadSettings.privacyStatus
            })
          })

          if (!playlistResponse.ok) {
            const error = await playlistResponse.json()
            throw new Error(error.details || 'Failed to create playlist')
          }

          const { playlistId: newPlaylistId } = await playlistResponse.json()
          playlistId = newPlaylistId
          setCurrentPlaylistId(playlistId)
          
          // Invalidate playlists cache when a new playlist is created
          clearPlaylistCache()
          console.log('Playlists cache invalidated due to new playlist creation')
        }
      }

      // Phase 3: Filter duplicates and prepare upload queue
      let finalVideos = processedVideos
      if (uploadSettings.uploadMode === 'playlist' && uploadSettings.useExistingPlaylist && existingVideos.length > 0) {
        finalVideos = processedVideos.filter(({ video, metadata }) => {
          const isDuplicate = existingVideos.some(existing => 
            existing.title.trim().toLowerCase() === metadata.title.trim().toLowerCase()
          )
          return !isDuplicate
        })
        console.log(`Filtered ${processedVideos.length - finalVideos.length} duplicate videos`)
      }

      // Prepare upload queue with positions
      const uploadQueue = finalVideos.map(({ video, metadata }, index) => ({
        video,
        metadata,
        position: uploadSettings.uploadMode === 'playlist' && uploadSettings.useExistingPlaylist 
          ? (existingVideos.length + index) 
          : index
      }))

      setUploadQueue(uploadQueue)

      // Phase 4: Parallel uploads with concurrency limit
      const concurrencyLimit = 3
      const uploadChunks = []
      for (let i = 0; i < uploadQueue.length; i += concurrencyLimit) {
        uploadChunks.push(uploadQueue.slice(i, i + concurrencyLimit))
      }

      for (const chunk of uploadChunks) {
        const uploadPromises = chunk.map(async ({ video, metadata, position }) => {
          setCurrentUpload(video.name)
          
          try {
            // Update status to uploading
            setVideos(prev => prev.map(v => 
              v.file === video.file ? { ...v, status: 'uploading', progress: 0 } : v
            ))

            // Upload video with pre-processed metadata
            const formData = new FormData()
            formData.append('video', video.file)
            formData.append('title', metadata.title)
            formData.append('description', metadata.description)
            formData.append('tags', JSON.stringify(metadata.tags))
            formData.append('category', metadata.category)
            if (playlistId) {
              formData.append('playlistId', playlistId)
              formData.append('position', position.toString())
            }
            formData.append('privacyStatus', uploadSettings.privacyStatus)
            formData.append('madeForKids', uploadSettings.madeForKids.toString())
            formData.append('uploadMode', uploadSettings.uploadMode)
            formData.append('isShort', (video.isShort || false).toString())
            formData.append('duration', (video.duration || 0).toString())
            formData.append('aspectRatio', (video.aspectRatio || 1.78).toString())

            const response = await fetch('/api/youtube/upload', {
              method: 'POST',
              body: formData
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.details || 'Upload failed')
            }

            const result = await response.json()
            
            // Update status to completed
            setVideos(prev => prev.map(v => 
              v.file === video.file 
                ? { ...v, status: 'completed', progress: 100, videoId: result.videoId }
                : v
            ))

            // Invalidate playlist videos cache when video is successfully uploaded to playlist
            if (playlistId) {
              clearPlaylistVideosCache(playlistId)
              console.log('Playlist videos cache invalidated for playlist:', playlistId)
            }

            // Add navigation links immediately if enabled
            if (uploadSettings.addPlaylistNavigation && result.videoId) {
              try {
                await fetch('/api/youtube/add-navigation-single', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    videoId: result.videoId,
                    playlistId: playlistId,
                    position: position
                  })
                })
              } catch (navError) {
                console.error('Navigation link failed for video:', video.name, navError)
              }
            }

            return result
          } catch (error) {
            console.error('Upload error:', error)
            setVideos(prev => prev.map(v => 
              v.file === video.file 
                ? { 
                    ...v, 
                    status: 'error', 
                    progress: 0, 
                    error: error instanceof Error ? error.message : 'Upload failed' 
                  }
                : v
            ))
            throw error
          }
        })

        await Promise.all(uploadPromises)
      }

    } catch (error) {
      console.error('Upload process error:', error)
      alert('Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setIsUploading(false)
      setCurrentUpload(null)
      setUploadQueue([])
    }
  }

  const completedUploads = videos.filter(v => v.status === 'completed').length
  const totalVideos = Math.min(videos.length, uploadSettings.maxVideos)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Youtube className="text-youtube mr-3" size={32} />
              <h1 className="text-xl font-bold text-gray-900">
                Universal YouTube Uploader
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {session ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="mr-2" size={16} />
                    {session.user?.name}
                    {session.error && (
                      <span className="ml-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        Auth Error
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <LogOut className="mr-2" size={16} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="btn-primary flex items-center"
                >
                  <User className="mr-2" size={16} />
                  Sign In with Google
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          /* Not Authenticated */
          <div className="text-center py-16">
            <Youtube className="text-youtube mx-auto mb-8" size={80} />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Upload Videos to Your YouTube Channel
            </h2>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              Easily upload multiple videos to YouTube with smart playlists, intelligent descriptions, 
              and automatic content detection. Sign in with your Google account to get started.
            </p>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
              <div className="upload-card text-center">
                <FolderOpen className="text-blue-500 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">Select Your Videos</h3>
                <p className="text-gray-600">Drag and drop or select multiple video files from any folder</p>
              </div>
              
              <div className="upload-card text-center">
                <Upload className="text-green-500 mx-auto mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">Smart Upload</h3>
                <p className="text-gray-600">Automatic descriptions, tags, and playlist organization</p>
              </div>
              
              <div className="upload-card text-center">
                <Youtube className="text-youtube mx-auto mb-4" size={48} />
                <h3 className="text-lg font-semibold mb-2">Your Channel</h3>
                <p className="text-gray-600">Videos upload directly to your own YouTube channel</p>
              </div>
            </div>
            
            <button
              onClick={() => signIn('google')}
              className="btn-primary text-lg px-8 py-4"
            >
              <User className="mr-3" size={20} />
              Sign In with Google to Continue
            </button>
          </div>
        ) : (
          /* Authenticated - Main App */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Upload Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* File Upload Zone */}
              <div className="upload-card">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <FolderOpen className="mr-2" size={20} />
                  Select Your Videos
                </h3>
                
<div className="space-y-4">
                  {/* File Drop Zone */}
                  <div
                    {...getRootProps()}
                    className={`upload-dropzone ${isDragActive ? 'dragover' : ''} cursor-pointer`}
                  >
                    <input {...getInputProps()} />
                    <FileVideo className="text-gray-400 mx-auto mb-4" size={48} />
                    
                    {isDragActive ? (
                      <div>
                        <p className="text-lg font-medium text-youtube">Drop your videos or folders here!</p>
                        <p className="text-sm text-gray-500 mt-2">We'll organize them for you</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-gray-700 mb-2">
                          Drag & drop videos or folders here, or click to select
                        </p>
                        <p className="text-sm text-gray-500">
                          Supports individual files or entire course folders
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Folder Selection Button */}
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="text-sm text-gray-500 font-medium">OR</span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  <div className="text-center">
                    <label className="btn-secondary inline-flex items-center cursor-pointer">
                      <FolderOpen className="mr-2" size={16} />
                      Select Entire Folder
                      <input
                        type="file"
                        {...({} as any)}
                        webkitdirectory="true"
                        multiple
                        onChange={handleFolderSelect}
                        className="hidden"
                        accept="video/*,.mp4,.avi,.mov,.mkv,.flv,.wmv,.webm,.m4v"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      Select a folder to upload all videos with preserved structure
                    </p>
                  </div>
                </div>

{videos.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-blue-800">
                          {videos.length} video{videos.length !== 1 ? 's' : ''} ready for upload
                        </p>
                        <div className="text-xs text-blue-600">
                          {Array.from(new Set(videos.map(v => v.folder))).length} folder{Array.from(new Set(videos.map(v => v.folder))).length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    {/* Folder Structure Preview */}
                    <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Folder Structure:</p>
                      <div className="space-y-1 text-xs text-gray-600">
                        {Array.from(new Set(videos.map(v => v.folder))).map(folder => {
                          const folderVideos = videos.filter(v => v.folder === folder)
                          return (
                            <div key={folder} className="flex items-center">
                              <FolderOpen className="mr-1" size={12} />
                              <span className="font-medium">{folder}</span>
                              <span className="ml-2 text-gray-500">({folderVideos.length} videos)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Settings */}
              {videos.length > 0 && (
                <div className="upload-card">
                  <h3 className="text-lg font-semibold mb-4">Upload Settings</h3>

                  {/* Upload Mode Selection */}
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-semibold text-gray-800">Upload Mode</h4>
                      {videos.filter(v => v.isShort).length > 0 && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {videos.filter(v => v.isShort).length} Short{videos.filter(v => v.isShort).length !== 1 ? 's' : ''} detected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Choose how to organize your videos. Playlists are great for courses and series, while individual uploads work well for standalone content and Shorts.
                    </p>

                    <div className="flex items-center space-x-6 mb-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="uploadMode"
                          value="playlist"
                          checked={uploadSettings.uploadMode === 'playlist'}
                          onChange={(e) => setUploadSettings(prev => ({ ...prev, uploadMode: e.target.value as 'playlist' | 'individual' }))}
                          className="w-4 h-4 text-youtube border-gray-300 focus:ring-youtube"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Upload to Playlist</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="uploadMode"
                          value="individual"
                          checked={uploadSettings.uploadMode === 'individual'}
                          onChange={(e) => setUploadSettings(prev => ({ ...prev, uploadMode: e.target.value as 'playlist' | 'individual' }))}
                          className="w-4 h-4 text-youtube border-gray-300 focus:ring-youtube"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Individual Videos
                          {videos.filter(v => v.isShort).length > 0 && uploadSettings.uploadMode === 'individual' && (
                            <span className="ml-1 text-xs text-purple-600">(Recommended for Shorts)</span>
                          )}
                        </span>
                      </label>
                    </div>

                    {uploadSettings.uploadMode === 'individual' && (
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium mb-1">Individual Upload Mode</p>
                        <p className="text-xs text-blue-700">
                          Videos will be uploaded as standalone content without being added to any playlist. 
                          This is perfect for YouTube Shorts, one-off videos, or content that doesn't belong to a series.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Playlist Selection Section */}
                  {uploadSettings.uploadMode === 'playlist' && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-semibold text-gray-800">Playlist Selection</h4>
                      <div className="flex items-center space-x-2">
                        {/* Cache status indicator */}
                        {availablePlaylists.length > 0 && (
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            <span>Cached ({availablePlaylists.length} playlists)</span>
                            <button
                              onClick={() => {
                                clearPlaylistCache()
                                clearPlaylistVideosCache() // Clear all playlist videos cache too
                                setAvailablePlaylists([])
                                setExistingPlaylistVideos([])
                              }}
                              className="ml-2 text-red-500 hover:text-red-700 underline"
                              title="Clear all cache and reload"
                            >
                              Clear All
                            </button>
                          </div>
                        )}
                        {session && !loadingPlaylists && availablePlaylists.length === 0 && (
                          <button
                            onClick={() => fetchUserPlaylists(true)}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Load My Playlists
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      Create a new playlist or add videos to an existing one. Auto-suggests folder name for new playlists.
                    </p>

                    {/* Playlist Mode Toggle */}
                    <div className="flex items-center space-x-6 mb-4">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="playlistMode"
                          checked={!uploadSettings.useExistingPlaylist}
                          onChange={() => {
                            setUploadSettings(prev => ({ 
                              ...prev, 
                              useExistingPlaylist: false,
                              selectedPlaylistId: '' // Clear selected playlist when switching to new playlist mode
                            }))
                            // Clear existing playlist videos when switching to new playlist mode
                            setExistingPlaylistVideos([])
                          }}
                          className="w-4 h-4 text-youtube border-gray-300 focus:ring-youtube"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">Create New Playlist</span>
                      </label>
                      
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="playlistMode"
                          checked={uploadSettings.useExistingPlaylist}
                          onChange={() => {
                            setUploadSettings(prev => ({ ...prev, useExistingPlaylist: true }))
                            // Only fetch playlists if we haven't loaded them yet and not currently loading
                            if (availablePlaylists.length === 0 && !loadingPlaylists) {
                              fetchUserPlaylists()
                            }
                          }}
                          className="w-4 h-4 text-youtube border-gray-300 focus:ring-youtube"
                        />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          Add to Existing Playlist
                          {loadingPlaylists && <span className="ml-1 text-xs text-gray-500">(Loading...)</span>}
                        </span>
                      </label>
                    </div>

                    {/* New Playlist Name Input */}
                    {!uploadSettings.useExistingPlaylist && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Playlist Name
                        </label>
                        <input
                          type="text"
                          value={uploadSettings.playlistName}
                          onChange={(e) => setUploadSettings(prev => ({ ...prev, playlistName: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent"
                          placeholder="My Video Collection"
                        />
                      </div>
                    )}

                    {/* Existing Playlist Selector */}
                    {uploadSettings.useExistingPlaylist && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Existing Playlist
                        </label>
                        {loadingPlaylists ? (
                          <div className="flex items-center p-3 border border-gray-300 rounded-lg bg-gray-50">
                            <div className="animate-spin w-4 h-4 border-2 border-youtube border-t-transparent rounded-full mr-2"></div>
                            <span className="text-sm text-gray-600">Loading playlists...</span>
                          </div>
                        ) : availablePlaylists.length > 0 ? (
                          <select
                            value={uploadSettings.selectedPlaylistId}
                            onChange={(e) => {
                              const playlistId = e.target.value
                              setUploadSettings(prev => ({ ...prev, selectedPlaylistId: playlistId }))
                              
                              // Fetch existing videos when playlist is selected
                              if (playlistId) {
                                fetchExistingPlaylistVideos(playlistId)
                              } else {
                                setExistingPlaylistVideos([])
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent"
                          >
                            <option value="">Select a playlist...</option>
                            {availablePlaylists.map((playlist) => (
                              <option key={playlist.id} value={playlist.id}>
                                {playlist.snippet.title} ({playlist.contentDetails.itemCount} videos)
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="space-y-3">
                            <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-600">
                              No playlists found. <button
                                onClick={() => fetchUserPlaylists(true)}
                                className="text-blue-600 hover:text-blue-800 underline ml-1"
                              >
                                Refresh
                              </button>
                            </div>
                            
                            {/* Manual Playlist ID Input */}
                            <div className="p-3 border border-orange-300 rounded-lg bg-orange-50">
                              <p className="text-sm font-medium text-orange-800 mb-2">
                                Manual Playlist ID
                              </p>
                              <p className="text-xs text-orange-700 mb-3">
                                If your playlist isn't showing up, you can enter the playlist ID manually. 
                                Find it in the URL: youtube.com/playlist?list=<strong>PLAYLIST_ID</strong>
                              </p>
                              <div className="flex space-x-2">
                                <input
                                  type="text"
                                  placeholder="e.g., PLExdYlNNwoiS7KfsjlIy3UHY69r0Qy-e5"
                                  className="flex-1 px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                                  onChange={(e) => {
                                    const playlistId = e.target.value.trim()
                                    if (playlistId) {
                                      setUploadSettings(prev => ({ ...prev, selectedPlaylistId: playlistId }))
                                      fetchExistingPlaylistVideos(playlistId)
                                    }
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const playlistId = 'PLExdYlNNwoiS7KfsjlIy3UHY69r0Qy-e5'
                                    setUploadSettings(prev => ({ ...prev, selectedPlaylistId: playlistId }))
                                    fetchExistingPlaylistVideos(playlistId)
                                  }}
                                  className="px-3 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium"
                                >
                                  Use Example
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Privacy Setting */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Privacy Setting
                      </label>
                      <select
                        value={uploadSettings.privacyStatus}
                        onChange={(e) => setUploadSettings(prev => ({ 
                          ...prev, 
                          privacyStatus: e.target.value as 'private' | 'unlisted' | 'public' 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent"
                      >
                        <option value="private">Private (Only you can see)</option>
                        <option value="unlisted">Unlisted (Anyone with link can see)</option>
                        <option value="public">Public (Everyone can see)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={uploadSettings.maxVideos}
                        onChange={(e) => setUploadSettings(prev => ({ 
                          ...prev, 
                          maxVideos: parseInt(e.target.value) || 10 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Max videos to upload in this session</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Type
                      </label>
                      <select
                        value={uploadSettings.contentType}
                        onChange={(e) => setUploadSettings(prev => ({ ...prev, contentType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent"
                      >
                        <option value="auto">Auto-Detect</option>
                        <option value="course">Educational Course</option>
                        <option value="business">Business Content</option>
                        <option value="tech">Technical/Programming</option>
                        <option value="creative">Creative/Design</option>
                        <option value="health">Health/Fitness</option>
                      </select>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-4"
                    >
                      <span>Advanced Settings</span>
                      <svg 
                        className={`ml-2 w-4 h-4 transition-transform ${showAdvancedSettings ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showAdvancedSettings && (
                      <div className="grid md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        {/* Made for Kids */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="madeForKids"
                            checked={uploadSettings.madeForKids}
                            onChange={(e) => setUploadSettings(prev => ({ 
                              ...prev, 
                              madeForKids: e.target.checked 
                            }))}
                            className="w-4 h-4 text-youtube border-gray-300 rounded focus:ring-youtube"
                          />
                          <label htmlFor="madeForKids" className="text-sm font-medium text-gray-700">
                            Made for Kids
                          </label>
                        </div>

                        {/* AI Analysis */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="useAiAnalysis"
                            checked={uploadSettings.useAiAnalysis}
                            onChange={(e) => setUploadSettings(prev => ({ 
                              ...prev, 
                              useAiAnalysis: e.target.checked 
                            }))}
                            className="w-4 h-4 text-youtube border-gray-300 rounded focus:ring-youtube"
                          />
                          <label htmlFor="useAiAnalysis" className="text-sm font-medium text-gray-700 flex items-center">
                            AI-Powered Descriptions & Tags
                            {uploadSettings.useAiAnalysis && (
                              <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                                ✨ Active
                              </span>
                            )}
                          </label>
                        </div>

                        {/* Playlist Navigation */}
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="addPlaylistNavigation"
                            checked={uploadSettings.addPlaylistNavigation}
                            onChange={(e) => setUploadSettings(prev => ({ 
                              ...prev, 
                              addPlaylistNavigation: e.target.checked 
                            }))}
                            className="w-4 h-4 text-youtube border-gray-300 rounded focus:ring-youtube"
                          />
                          <div className="flex flex-col">
                            <label htmlFor="addPlaylistNavigation" className="text-sm font-medium text-gray-700 flex items-center">
                              Add Playlist Navigation Links
                              {uploadSettings.addPlaylistNavigation && (
                                <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                  🔗 Active
                                </span>
                              )}
                            </label>
                            <p className="text-xs text-gray-500 mt-1">
                              Adds previous/next video links and playlist navigation to each video description
                            </p>
                          </div>
                        </div>

                        {/* Cache Management */}
                        <div className="md:col-span-2 p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-700">Cache Management</h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Active</span>
                            </div>
                          </div>
                          <div className="space-y-2 text-xs text-gray-600">
                            <div className="flex items-center justify-between">
                              <span>Playlists Cache:</span>
                              <span className="font-medium">{availablePlaylists.length > 0 ? 'Cached' : 'Not cached'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Playlist Videos Cache:</span>
                              <span className="font-medium">{existingPlaylistVideos.length > 0 ? 'Cached' : 'Not cached'}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-100">
                              <button
                                onClick={() => {
                                  clearPlaylistCache()
                                  clearPlaylistVideosCache()
                                  setAvailablePlaylists([])
                                  setExistingPlaylistVideos([])
                                  alert('Cache cleared successfully!')
                                }}
                                className="text-red-600 hover:text-red-800 underline text-xs"
                              >
                                Clear All Cache
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Category */}
                        <div>
                          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                            YouTube Category
                            {uploadSettings.category !== '27' && (
                              <span className="ml-2 text-xs text-green-600 font-normal">
                                ✨ AI Suggested
                              </span>
                            )}
                          </label>
                          <select
                            id="category"
                            value={uploadSettings.category}
                            onChange={(e) => setUploadSettings(prev => ({ ...prev, category: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent text-sm"
                          >
                            <option value="27">Education</option>
                            <option value="28">Science & Technology</option>
                            <option value="26">Howto & Style</option>
                            <option value="22">People & Blogs</option>
                            <option value="25">News & Politics</option>
                            <option value="24">Entertainment</option>
                            <option value="19">Travel & Events</option>
                            <option value="17">Sports</option>
                            <option value="15">Pets & Animals</option>
                            <option value="10">Music</option>
                          </select>
                        </div>

                        {/* Title Format */}
                        <div>
                          <label htmlFor="titleFormat" className="block text-sm font-medium text-gray-700 mb-1">
                            Title Format
                            {uploadSettings.titleFormat === 'original' && uploadSettings.useAiAnalysis && (
                              <span className="ml-2 text-xs text-blue-600 font-normal">
                                ✨ AI Enhanced
                              </span>
                            )}
                          </label>
                          <select
                            id="titleFormat"
                            value={uploadSettings.titleFormat}
                            onChange={(e) => setUploadSettings(prev => ({ 
                              ...prev, 
                              titleFormat: e.target.value as 'original' | 'cleaned' | 'custom' 
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent text-sm"
                          >
                            <option value="original">Original Filename</option>
                            <option value="cleaned">Cleaned Filename</option>
                            <option value="custom">Custom Format</option>
                          </select>
                        </div>

                        {/* Custom Title Options */}
                        {uploadSettings.titleFormat === 'custom' && (
                          <>
                            <div>
                              <label htmlFor="customTitlePrefix" className="block text-sm font-medium text-gray-700 mb-1">
                                Title Prefix
                              </label>
                              <input
                                type="text"
                                id="customTitlePrefix"
                                value={uploadSettings.customTitlePrefix}
                                onChange={(e) => setUploadSettings(prev => ({ 
                                  ...prev, 
                                  customTitlePrefix: e.target.value 
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent text-sm"
                                placeholder="e.g., Course: "
                              />
                            </div>
                            <div>
                              <label htmlFor="customTitleSuffix" className="block text-sm font-medium text-gray-700 mb-1">
                                Title Suffix
                              </label>
                              <input
                                type="text"
                                id="customTitleSuffix"
                                value={uploadSettings.customTitleSuffix}
                                onChange={(e) => setUploadSettings(prev => ({ 
                                  ...prev, 
                                  customTitleSuffix: e.target.value 
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-youtube focus:border-transparent text-sm"
                                placeholder="e.g., - Tutorial"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Will upload <span className="font-semibold text-youtube">{totalVideos}</span> of {videos.length} videos
                    </div>
                    
                    <button
                      onClick={handleOptimizedUpload}
                      disabled={
                        isUploading || 
                        (uploadSettings.uploadMode === 'playlist' && (
                          (!uploadSettings.useExistingPlaylist && !uploadSettings.playlistName) ||
                          (uploadSettings.useExistingPlaylist && !uploadSettings.selectedPlaylistId)
                        ))
                      }
                      className="btn-primary flex items-center"
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin mr-2 w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                          {(aiProcessing.categoryAnalysis || aiProcessing.playlistAnalysis) 
                            ? "Processing..." 
                            : "Uploading..."}
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2" size={16} />
                          Start Upload
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Progress Panel */}
            <div className="lg:col-span-1">
              <div className="upload-card sticky top-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="mr-2" size={20} />
                  Upload Progress
                </h3>

                {videos.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileVideo className="mx-auto mb-3" size={32} />
                    <p>No videos selected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Overall Progress */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Overall Progress</span>
                        <span className="font-medium">{completedUploads}/{totalVideos}</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${(completedUploads / totalVideos) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Duplicate Videos Info */}
                    {uploadSettings.useExistingPlaylist && (
                      <>
                        {loadingExistingVideos && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-blue-800">Checking for Duplicates</p>
                                <p className="text-xs text-blue-600">
                                  Analyzing existing playlist videos...
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!loadingExistingVideos && existingPlaylistVideos.length > 0 && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-blue-800">Duplicate Detection Active</p>
                                  <div className="flex items-center text-xs text-blue-600">
                                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                                    <span>Cached</span>
                                  </div>
                                </div>
                                <p className="text-xs text-blue-600">
                                  {existingPlaylistVideos.length} existing videos found. Duplicates will be skipped automatically.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* Pre-Processing Status */}
                    {preProcessingStatus.isPreProcessing && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-800">Pre-Processing Videos</p>
                            <p className="text-xs text-blue-600 truncate">
                              {preProcessingStatus.currentStep}
                            </p>
                            <div className="mt-2 w-full bg-blue-200 rounded-full h-1">
                              <div 
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${preProcessingStatus.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AI Processing Status */}
                    {(aiProcessing.categoryAnalysis || aiProcessing.playlistAnalysis || aiProcessing.videoAnalysis || aiProcessing.addingNavigation) && (
                      <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full flex-shrink-0"></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-purple-800">
                              {aiProcessing.addingNavigation ? "Adding Navigation" : "AI Processing"}
                            </p>
                            <p className="text-xs text-purple-600 truncate">
                              {aiProcessing.categoryAnalysis && "Analyzing content for category suggestion..."}
                              {aiProcessing.playlistAnalysis && "Generating playlist description..."}
                              {aiProcessing.videoAnalysis && aiProcessing.currentVideoAnalysis === 'batch processing' && 
                                "Enhancing all video descriptions with AI-powered titles, descriptions & tags..."}
                              {aiProcessing.videoAnalysis && aiProcessing.currentVideoAnalysis && aiProcessing.currentVideoAnalysis !== 'batch processing' && 
                                `Analyzing "${aiProcessing.currentVideoAnalysis}" for title & description...`}
                              {aiProcessing.addingNavigation && "Adding playlist navigation links to video descriptions..."}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Current Upload */}
                    {currentUpload && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-800">Currently uploading:</p>
                        <p className="text-sm text-blue-600 truncate">{currentUpload}</p>
                      </div>
                    )}

                    {/* Playlist Information */}
                    {currentPlaylistId && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-800 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                          {uploadSettings.useExistingPlaylist 
                            ? 'Using Existing Playlist' 
                            : 'Playlist Created'}
                        </p>
                        {uploadSettings.useExistingPlaylist && uploadSettings.selectedPlaylistId && (
                          <p className="text-xs text-green-700 mt-1">
                            <span className="font-medium">Name:</span> {
                              availablePlaylists.find(p => p.id === uploadSettings.selectedPlaylistId)?.snippet.title || 'Selected Playlist'
                            }
                          </p>
                        )}
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-green-700">
                              <span className="font-medium">Playlist ID:</span> {currentPlaylistId}
                            </p>
                            <button
                              onClick={() => navigator.clipboard.writeText(currentPlaylistId)}
                              className="text-xs text-green-700 hover:text-green-800 p-1 hover:bg-green-100 rounded"
                              title="Copy Playlist ID"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <a 
                            href={`https://www.youtube.com/playlist?list=${currentPlaylistId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-xs text-green-700 hover:text-green-800 hover:underline"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            View Playlist on YouTube
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Video List */}
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {videos.slice(0, uploadSettings.maxVideos).map((video, index) => (
                        <div 
                          key={index}
                          className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                        >
                          {/* Video Thumbnail */}
                          <div className="flex-shrink-0 relative">
                            {video.thumbnail ? (
                              <img 
                                src={video.thumbnail} 
                                alt={`Thumbnail for ${video.name}`}
                                className="w-12 h-7 object-cover rounded border bg-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-7 bg-gray-200 rounded border flex items-center justify-center">
                                {video.status === 'pending' ? (
                                  <div className="animate-pulse">
                                    <FileVideo className="text-gray-400" size={14} />
                                  </div>
                                ) : (
                                  <FileVideo className="text-gray-400" size={14} />
                                )}
                              </div>
                            )}
                            
                            {/* Status overlay */}
                            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                              {video.status === 'completed' && (
                                <CheckCircle className="text-green-500" size={12} />
                              )}
                              {video.status === 'error' && (
                                <AlertCircle className="text-red-500" size={12} />
                              )}
                              {video.status === 'uploading' && (
                                <div className="animate-spin w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full" />
                              )}
                              {video.status === 'pending' && (
                                <Clock className="text-gray-400" size={12} />
                              )}
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {video.name}
                              </p>
                              {video.isShort && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  Short
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>{video.size}</span>
                              {video.duration && (
                                <>
                                  <span>•</span>
                                  <span>{Math.round(video.duration)}s</span>
                                </>
                              )}
                              {video.aspectRatio && (
                                <>
                                  <span>•</span>
                                  <span>{video.aspectRatio < 1 ? 'Vertical' : video.aspectRatio === 1 ? 'Square' : 'Landscape'}</span>
                                </>
                              )}
                              {video.relativePath && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{video.relativePath}</span>
                                </>
                              )}
                            </div>
                            {video.error && (
                              <p className="text-xs text-red-600">{video.error}</p>
                            )}
                          </div>

                          <div className="flex items-center space-x-1">
                            {video.videoId && (
                              <a
                                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 text-youtube hover:text-youtube-dark transition-colors p-1 rounded hover:bg-gray-200"
                                title="View on YouTube"
                              >
                                <Play size={16} />
                              </a>
                            )}
                            
                            {/* Remove Button */}
                            <button
                              onClick={() => {
                                setVideos(prevVideos => prevVideos.filter((_, i) => i !== index))
                              }}
                              className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 opacity-0 group-hover:opacity-100"
                              title="Remove video from upload list"
                              disabled={video.status === 'uploading'}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <p className="text-sm text-gray-600">
                © {new Date().getFullYear()} Universal YouTube Uploader
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link 
                href="/privacy" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms" 
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function extractPlaylistName(filename: string): string {
  // Remove common prefixes and numbering
  let name = filename.replace(/^\d+[\.\-_]?\s*/, '')
  
  // Extract meaningful part (before common separators)
  const parts = name.split(/[\-_\.]/)
  if (parts.length > 1) {
    return parts.slice(0, Math.ceil(parts.length / 2)).join(' ')
  }
  
  return name || 'My Video Collection'
}