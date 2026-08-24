import { performance } from 'perf_hooks';

/**
 * Timing Helper - High-precision performance measurement
 * Creates a high-precision stopwatch
 * @returns {object} { stop: () => number, elapsed: () => number }
 */
export function createStopwatch() {
  const start = performance.now();
  return {
    stop: () => {
      const end = performance.now();
      return Math.round((end - start) * 100) / 100;
    },
    elapsed: () => {
      const now = performance.now();
      return Math.round((now - start) * 100) / 100;
    }
  };
}

/**
 * Formats milliseconds into human-readable string
 * @param {number} ms
 * @returns {string}
 */
export function formatMs(ms) {
  if (ms === undefined || ms === null || isNaN(ms)) return '0 ms';
  if (ms < 1000) return `${Math.round(ms * 10) / 10} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/**
 * Formats byte size into human-readable string
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export default {
  createStopwatch,
  formatMs,
  formatBytes
};

