const levels = {
  INFO: '\x1b[36m[INFO]\x1b[0m',
  SUCCESS: '\x1b[32m[SUCCESS]\x1b[0m',
  WARN: '\x1b[33m[WARN]\x1b[0m',
  ERROR: '\x1b[31m[ERROR]\x1b[0m',
  DEBUG: '\x1b[35m[DEBUG]\x1b[0m'
};

function formatTimestamp() {
  return new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

export const logger = {
  info: (msg, ...args) => console.log(`${levels.INFO} [${formatTimestamp()}] ${msg}`, ...args),
  success: (msg, ...args) => console.log(`${levels.SUCCESS} [${formatTimestamp()}] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`${levels.WARN} [${formatTimestamp()}] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`${levels.ERROR} [${formatTimestamp()}] ${msg}`, ...args),
  debug: (msg, ...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${levels.DEBUG} [${formatTimestamp()}] ${msg}`, ...args);
    }
  }
};

export default logger;

