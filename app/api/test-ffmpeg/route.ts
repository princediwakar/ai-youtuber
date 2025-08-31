import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const ffmpegPath = require('ffmpeg-static');

export async function GET(request: NextRequest) {
  try {
    console.log('Testing FFmpeg in serverless environment...');
    
    // Check if ffmpeg-static provides a path
    console.log('ffmpeg-static path:', ffmpegPath);
    
    // Test if file exists
    const exists = ffmpegPath ? existsSync(ffmpegPath) : false;
    console.log('FFmpeg binary exists:', exists);
    
    // Test audio file accessibility
    const audioPath = resolve(process.cwd(), 'public', 'audio', '1.mp3');
    const audioExists = existsSync(audioPath);
    console.log('Audio file path:', audioPath);
    console.log('Audio file exists:', audioExists);
    
    // Test basic ffmpeg command
    if (ffmpegPath && exists) {
      try {
        const result = await new Promise<string>((resolve, reject) => {
          const process = spawn(ffmpegPath, ['-version']);
          let output = '';
          
          process.stdout.on('data', (data) => {
            output += data.toString();
          });
          
          process.stderr.on('data', (data) => {
            output += data.toString();
          });
          
          process.on('close', (code) => {
            if (code === 0) {
              resolve(output);
            } else {
              reject(new Error(`FFmpeg exited with code ${code}`));
            }
          });
          
          process.on('error', (err) => {
            reject(err);
          });
        });
        
        return NextResponse.json({ 
          success: true, 
          ffmpegPath,
          exists,
          audioPath,
          audioExists,
          version: result.split('\n')[0] // First line usually has version
        });
      } catch (error) {
        return NextResponse.json({ 
          success: false, 
          ffmpegPath,
          exists,
          audioPath,
          audioExists,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      return NextResponse.json({ 
        success: false, 
        ffmpegPath,
        exists,
        audioPath,
        audioExists,
        error: 'FFmpeg binary not found'
      });
    }
  } catch (error) {
    console.error('FFmpeg test failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const runtime = 'nodejs';
export const maxDuration = 30;