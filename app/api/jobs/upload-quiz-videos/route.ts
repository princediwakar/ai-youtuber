import { NextRequest, NextResponse } from 'next/server';
import { getPendingJobs, markJobCompleted, updateJob } from '@/lib/database';
import { google } from 'googleapis';
import { getServerSession } from 'next-auth';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Auth check using CRON_SECRET
    const authHeader = request.headers.get('Authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log('Starting YouTube upload batch...');

    // Get jobs at step 4 (upload_pending)
    const jobs = await getPendingJobs(4, 2); // Process 2 jobs at a time (upload is rate-limited)
    
    if (jobs.length === 0) {
      return NextResponse.json({ 
        success: true, 
        processed: 0, 
        message: 'No jobs pending YouTube upload' 
      });
    }

    const processedJobs = [];

    for (const job of jobs) {
      try {
        console.log(`Uploading video for job ${job.id} - ${job.test_type} ${job.subject}`);

        // Convert video buffer back from base64
        const videoBuffer = Buffer.from(job.data.videoBuffer, 'base64');
        
        // Generate metadata for the video
        const metadata = generateVideoMetadata(job.data.question, job.test_type, job.subject, job.id);
        
        // Upload to YouTube
        const youtubeVideoId = await uploadToYouTube(videoBuffer, metadata);
        
        // Mark job as completed
        await markJobCompleted(job.id, youtubeVideoId, metadata);
        
        processedJobs.push({ 
          id: job.id, 
          test_type: job.test_type, 
          subject: job.subject,
          youtube_video_id: youtubeVideoId
        });
        
        console.log(`YouTube upload completed for job ${job.id}: https://youtube.com/watch?v=${youtubeVideoId}`);

      } catch (error) {
        console.error(`Failed to upload video for job ${job.id}:`, error);
        
        // Mark job as failed
        await updateJob(job.id, {
          status: 'failed',
          error_message: `YouTube upload failed: ${error.message}`
        });
      }
    }

    console.log(`YouTube upload batch completed. Processed ${processedJobs.length} jobs.`);

    return NextResponse.json({ 
      success: true, 
      processed: processedJobs.length,
      jobs: processedJobs
    });

  } catch (error) {
    console.error('YouTube upload batch failed:', error);
    return NextResponse.json(
      { success: false, error: 'YouTube upload failed' },
      { status: 500 }
    );
  }
}

function generateVideoMetadata(question: any, testType: string, subject: string, jobId: string) {
  // Generate quiz-focused title
  const titles = {
    'SAT-Math': `SAT Math Quick Quiz: ${question.topic || 'Problem Solving'} 🧮`,
    'SAT-Reading': `SAT Reading Practice: ${question.topic || 'Comprehension'} 📚`,
    'SAT-Writing': `SAT Writing Skills: ${question.topic || 'Grammar'} ✍️`,
    'GMAT-Verbal': `GMAT Verbal Challenge: ${question.topic || 'Critical Thinking'} 💼`,
    'GMAT-Quantitative': `GMAT Quant Practice: ${question.topic || 'Problem Solving'} 📊`,
    'GRE-Verbal': `GRE Verbal Skills: ${question.topic || 'Word Power'} 🎓`,
    'GRE-Quantitative': `GRE Math Challenge: ${question.topic || 'Quantitative'} 🔢`
  };
  
  const titleKey = `${testType}-${subject}`;
  const title = titles[titleKey] || `${testType} ${subject} Practice Question #${jobId.slice(-4)}`;
  
  // Generate educational description
  const description = `🎯 Quick ${testType} practice question - can you solve it?

${question.question.slice(0, 150)}${question.question.length > 150 ? '...' : ''}

Test your ${subject.toLowerCase()} skills with this practice problem! 

⏱️ 20-second challenge
🧠 Think, choose, learn
✅ Answer revealed with explanation

Perfect for:
• ${testType} test preparation
• Quick study breaks
• Skill assessment
• Educational practice

#${testType} #StudyTips #Quiz #Shorts #TestPrep #${subject} #Practice #Education #QuickLearning

Ready to challenge yourself? Watch and see how you do! 🚀`;

  // Generate relevant tags
  const tags = [
    testType.toLowerCase(),
    'quiz',
    'practice', 
    'shorts',
    'study',
    subject.toLowerCase(),
    'test prep',
    'education',
    question.topic || 'general',
    'quick quiz'
  ].slice(0, 10); // YouTube allows max 10 tags

  return {
    title: title.slice(0, 100), // YouTube title limit
    description: description.slice(0, 5000), // YouTube description limit
    tags
  };
}

async function uploadToYouTube(videoBuffer: Buffer, metadata: any): Promise<string> {
  try {
    // For now, we'll use a service account or stored credentials
    // In a real implementation, you'd need to set up OAuth2 properly
    
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'http://localhost:3000/api/auth/callback/google'
    );

    // You would need to store and refresh tokens properly
    // For this example, we'll assume tokens are available
    // oauth2Client.setCredentials({
    //   access_token: 'your-access-token',
    //   refresh_token: 'your-refresh-token'
    // });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    // Create temporary file for upload
    const tempFile = path.join('/tmp', `quiz-upload-${uuidv4()}.mp4`);
    fs.writeFileSync(tempFile, videoBuffer);

    try {
      const response = await youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags,
            categoryId: '27', // Education category
            defaultAudioLanguage: 'en',
            defaultLanguage: 'en'
          },
          status: {
            privacyStatus: 'public',
            madeForKids: false,
            selfDeclaredMadeForKids: false
          }
        },
        media: {
          body: fs.createReadStream(tempFile)
        }
      });

      // Cleanup temp file
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      return response.data.id!;
      
    } catch (uploadError) {
      // Cleanup temp file on error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
      throw uploadError;
    }

  } catch (error) {
    console.error('YouTube upload error:', error);
    
    // For development/testing, return a mock video ID
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: returning mock video ID');
      return `mock-video-${Date.now()}`;
    }
    
    throw new Error(`YouTube upload failed: ${error.message}`);
  }
}

// Helper function to set up YouTube credentials (you'll need to implement OAuth flow)
async function getYouTubeAuth() {
  // This would typically involve:
  // 1. Getting user's stored refresh token from database
  // 2. Refreshing access token if needed  
  // 3. Setting up OAuth2 client
  
  // For now, using environment variables (not recommended for production)
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  // You would load stored tokens here
  // const tokens = await getUserTokens();
  // oauth2Client.setCredentials(tokens);

  return oauth2Client;
}