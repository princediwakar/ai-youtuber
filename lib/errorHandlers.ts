/**
 * Global error handlers for unhandled promise rejections and uncaught exceptions
 */

let initialized = false;

export function initializeErrorHandlers() {
  if (initialized) return;
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
    console.error('🚨 Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    
    // Log additional context if available
    if (reason?.message) {
      console.error('Error message:', reason.message);
    }
    if (reason?.stack) {
      console.error('Stack trace:', reason.stack);
    }
    
    // Don't exit the process in production, just log
    if (process.env.NODE_ENV !== 'production') {
      console.warn('💡 In development mode - continuing execution');
    }
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('Stack trace:', error.stack);
    
    // In production, we might want to gracefully shut down
    if (process.env.NODE_ENV === 'production') {
      console.error('💥 Uncaught exception in production - shutting down gracefully');
      process.exit(1);
    } else {
      console.warn('💡 In development mode - continuing execution');
    }
  });

  // Handle warning events
  process.on('warning', (warning: any) => {
    console.warn('⚠️ Node.js Warning:', warning.name);
    console.warn('Message:', warning.message);
    if (warning.stack) {
      console.warn('Stack:', warning.stack);
    }
  });

  initialized = true;
  console.log('✅ Global error handlers initialized');
}

/**
 * Wrapper function to safely execute async operations with error handling
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    console.error(`❌ Safe execution failed in ${context}:`, error);
    return fallbackValue;
  }
}

/**
 * Wrapper for promises that should not throw unhandled rejections
 */
export function safePromise<T>(
  promise: Promise<T>,
  context: string
): Promise<T | null> {
  return promise.catch(error => {
    console.error(`❌ Promise failed in ${context}:`, error);
    return null;
  });
}