import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from './Src/Config/config.js';
import { connectDB, closeDB } from './Src/Config/database.js';
import apiRoutes from './Src/Routes/index.js';
import logger from './Src/Utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.env !== 'test') {
  app.use(morgan('dev'));
}

// Mount API routes
app.use('/api', apiRoutes);

// Frontend static build directory
const frontendDistPath = path.join(__dirname, '..', 'Frontend', 'dist');
const hasFrontendBuild = fs.existsSync(path.join(frontendDistPath, 'index.html'));

if (hasFrontendBuild) {
  app.use(express.static(frontendDistPath));

  // SPA fallback for all remaining GET requests (Express 5 compatible)
  app.use((req, res, next) => {
    if (req.method === 'GET') {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    } else {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl
      });
    }
  });
} else {
  // Welcome Root route if frontend not built yet
  app.get('/', (req, res) => {
    res.json({
      name: 'URL Analysis API',
      version: '1.0.0',
      status: 'running',
      frontend: 'Run npm run build in Frontend to serve the web UI or run Vite on port 5173',
      documentation: {
        analyze: 'POST /api/analyze',
        streamAnalyze: 'GET or POST /api/analyze/stream',
        websites: 'GET /api/websites',
        scans: 'GET /api/scans/:id',
        apiCheck: 'POST /api/api-check',
        quickChecks: 'GET /api/quick-check/:type?url=https://example.com'
      }
    });
  });

  // 404 handler for API routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      path: req.originalUrl
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`Unhandled Server Error: ${err.message}`, err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start Server (when executed directly via node or nodemon)
const PORT = process.env.PORT || config.port || 5000;
let server = null;

export async function startServer() {
  // 1. Establish MongoDB connection
  await connectDB();

  // 2. Start HTTP Server
  server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(` Server listening on port ${PORT}`);
  });

  // Handle server 'error' events (such as port in use)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(` Port ${PORT} is already in use by another process!`);
      logger.warn(`Please stop the process using port ${PORT} or configure a different PORT in .env`);
      process.exit(1);
    } else {
      logger.error(` Server socket error: ${err.message}`, err.stack);
      process.exit(1);
    }
  });

  return server;
}

const isMainModule = process.argv[1] && (path.resolve(process.argv[1]) === __filename);
if (isMainModule) {
  startServer();
}

// Handle graceful shutdown for both SIGTERM and SIGINT (Ctrl+C)
async function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await closeDB();
      logger.info('HTTP server closed cleanly. Process terminated.');
      process.exit(0);
    });
    // Force close after 3s timeout if pending connections exist
    setTimeout(async () => {
      await closeDB();
      logger.warn('Forcing process shutdown after timeout.');
      process.exit(0);
    }, 3000).unref();
  } else {
    await closeDB();
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Prevent uncaught exceptions from silently terminating without logging
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, err.stack);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Promise Rejection:', reason);
});

export { app };
export default app;

