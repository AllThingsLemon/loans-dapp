// Simple logging utility that can be configured based on environment
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info('[INFO]', ...args)
    }
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args)
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args)
  }
}

// For production, we might want to send logs to a service
// This structure makes it easy to replace console.log with actual logging
