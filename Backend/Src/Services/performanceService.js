import http from 'http';
import https from 'https';
import zlib from 'zlib';
import { performance } from 'perf_hooks';
import config from '../Config/config.js';
import logger from '../Utils/logger.js';


/**
 * Measures low-level network performance timings for a target URL
 * @param {string} targetUrl
 * @param {object} [options={}]
 * @returns {Promise<object>}
 */
export function measurePerformance(targetUrl, options = {}) {

  return new Promise((resolve) => {
    const urlObj = new URL(targetUrl);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    const timeoutMs = options.timeout || config.defaultTimeout;

    const timings = {
      dnsTime: 0,
      tcpTime: 0,
      tlsTime: 0,
      ttfb: 0,
      downloadTime: 0,
      totalTime: 0,
      pageSizeBytes: 0,
      statusCode: null,
      statusText: null,
      httpVersion: null,
      headers: {},
      body: '',
      error: null
    };

    const start = performance.now();
    let dnsEnd = 0;
    let tcpEnd = 0;
    let tlsEnd = 0;
    let firstByteTime = 0;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': options.userAgent || config.defaultUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        ...(options.headers || {})
      },
      timeout: timeoutMs,
      rejectUnauthorized: false
    };

    const req = client.request(reqOptions, (res) => {
      firstByteTime = performance.now();
      timings.ttfb = Math.round((firstByteTime - start) * 100) / 100;
      timings.statusCode = res.statusCode;
      timings.statusText = res.statusMessage;
      timings.httpVersion = `HTTP/${res.httpVersion}`;
      timings.headers = res.headers;

      const encoding = (res.headers['content-encoding'] || '').toLowerCase();

      let stream = res;
      if (encoding === 'gzip') {
        stream = res.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = res.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = res.pipe(zlib.createBrotliDecompress());
      }

      res.on('data', (chunk) => {
        timings.pageSizeBytes += chunk.length;
      });

      const bodyChunks = [];
      stream.on('data', (chunk) => {
        bodyChunks.push(chunk);
      });

      stream.on('end', () => {
        const finishTime = performance.now();
        timings.totalTime = Math.round((finishTime - start) * 100) / 100;
        timings.downloadTime = Math.round((finishTime - firstByteTime) * 100) / 100;
        
        const buffer = Buffer.concat(bodyChunks);
        timings.body = buffer.toString('utf-8');

        resolve(timings);
      });

      stream.on('error', (err) => {
        timings.error = err.message;
        const finishTime = performance.now();
        timings.totalTime = Math.round((finishTime - start) * 100) / 100;
        resolve(timings);
      });

      res.on('error', (err) => {
        timings.error = err.message;
        timings.totalTime = Math.round((performance.now() - start) * 100) / 100;
        resolve(timings);
      });
    });

    req.on('socket', (socket) => {
      socket.on('lookup', () => {
        dnsEnd = performance.now();
        timings.dnsTime = Math.round((dnsEnd - start) * 100) / 100;
      });

      socket.on('connect', () => {
        tcpEnd = performance.now();
        timings.tcpTime = Math.round((tcpEnd - (dnsEnd || start)) * 100) / 100;
      });

      socket.on('secureConnect', () => {
        tlsEnd = performance.now();
        timings.tlsTime = Math.round((tlsEnd - tcpEnd) * 100) / 100;
      });
    });

    req.on('timeout', () => {
      timings.error = `Request timed out after ${timeoutMs}ms`;
      req.destroy();
      resolve(timings);
    });

    req.on('error', (err) => {
      timings.error = err.message;
      timings.totalTime = Math.round((performance.now() - start) * 100) / 100;
      resolve(timings);
    });

    req.end();
  });
}

export default {
  measurePerformance
};

