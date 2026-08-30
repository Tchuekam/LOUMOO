/**
 * LOUMOO Structured JSON Logger
 * Formats logs with correlation IDs, timestamps, and log levels
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.info : LOG_LEVELS.debug;

function formatLog(level, message, context = {}) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    message,
    ...(context.requestId ? { requestId: context.requestId } : {}),
    ...(context.userId ? { userId: context.userId } : {}),
    ...(context.path ? { path: context.path } : {}),
    ...context
  };

  if (process.env.NODE_ENV === 'production') {
    return JSON.stringify(entry);
  }

  // Pretty output for development
  const colorMap = {
    debug: '\x1b[34m[DEBUG]\x1b[0m',
    info: '\x1b[32m[INFO]\x1b[0m',
    warn: '\x1b[33m[WARN]\x1b[0m',
    error: '\x1b[31m[ERROR]\x1b[0m'
  };

  const prefix = colorMap[level] || `[${level.toUpperCase()}]`;
  const reqStr = context.requestId ? `\x1b[36m(${context.requestId.slice(0, 8)})\x1b[0m ` : '';
  const extra = Object.keys(context).filter(k => !['requestId', 'userId', 'path'].includes(k)).length > 0
    ? ` ${JSON.stringify(context)}`
    : '';

  return `${timestamp} ${prefix} ${reqStr}${message}${extra}`;
}

const logger = {
  debug(message, context = {}) {
    if (LOG_LEVELS.debug >= currentLevel) {
      console.debug(formatLog('debug', message, context));
    }
  },
  info(message, context = {}) {
    if (LOG_LEVELS.info >= currentLevel) {
      console.log(formatLog('info', message, context));
    }
  },
  warn(message, context = {}) {
    if (LOG_LEVELS.warn >= currentLevel) {
      console.warn(formatLog('warn', message, context));
    }
  },
  error(message, error = null, context = {}) {
    if (LOG_LEVELS.error >= currentLevel) {
      const errContext = {
        ...context,
        ...(error ? {
          errorMessage: error.message,
          errorCode: error.code,
          stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
        } : {})
      };
      console.error(formatLog('error', message, errContext));
    }
  }
};

module.exports = logger;
