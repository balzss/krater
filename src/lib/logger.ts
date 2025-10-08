/**
 * Simple logger utility with environment-aware debug logging
 * Debug logs only appear in development environment
 */
export const logger = {
  debug: (msg: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(msg, ...args)
    }
  },
  info: (msg: string, ...args: unknown[]) => console.info(msg, ...args),
  warn: (msg: string, ...args: unknown[]) => console.warn(msg, ...args),
  error: (msg: string, ...args: unknown[]) => console.error(msg, ...args),
}
