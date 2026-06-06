/**
 * @file src/lib/logger.ts
 * @description Centralized logging utility for the Kulika application.
 * Requirement: Provides consistent log levels and formatting for server-side and client-side observability.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

function shouldLog(level: LogLevel) {
  return levelOrder[level] >= (levelOrder[configuredLevel] ?? levelOrder.info);
}

function write(level: LogLevel, message: string, meta?: unknown) {
  if (!shouldLog(level)) return;

  const payload = {
    level,
    service: 'kulika',
    message,
    timestamp: new Date().toISOString(),
    meta,
  };

  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

const logger = {
  debug: (message: string, meta?: unknown) => write('debug', message, meta),
  info: (message: string, meta?: unknown) => write('info', message, meta),
  warn: (message: string, meta?: unknown) => write('warn', message, meta),
  error: (message: string, meta?: unknown) => write('error', message, meta),
};

export default logger;
