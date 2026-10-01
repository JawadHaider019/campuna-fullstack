import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { initSocketServer } from './socket.js';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import creditRoutes from './routes/credit.js';
import referralRoutes from './routes/referral.js';
import listingRoutes from './routes/listings.js';
import subscriptionRoutes from './routes/subscription.js';
import favoritesRoutes from './routes/favorites.js';
import adminRoutes from './routes/admin.js';
import conversationRoutes from './routes/conversations.js';
import broadcastRoutes from './routes/broadcasts.js';
import postsRoutes from './routes/posts.js';
import aiRoutes from './routes/ai.js';
import contactRoutes from './routes/contact.js';
import stripeRoutes from './routes/stripe.js';
import { handleWebhook as handleStripeWebhook } from './controllers/stripe.js';
import './config/initAdminTable.js';
import './config/initChatTables.js';
import './config/initReportsTable.js';
import { initBroadcastsTable } from './config/initBroadcastsTable.js';
import { initBlogPostsTable } from './config/initBlogPostsTable.js';
import pool from './config/database.js';
import { seedMarketplaceData } from './config/seedMarketplaceData.js';

import path from 'path';
import fs from 'fs';

// Initialize broadcasts table
initBroadcastsTable().catch(e => console.error('Broadcasts init error:', e.message));

// Initialize blog posts table and seed
initBlogPostsTable().catch(e => console.error('Blog posts init error:', e.message));

// Auto-seed sample marketplace data if DB has fewer than 5 listings
pool.query('SELECT count(*) FROM listings')
  .then(res => {
    const count = parseInt(res.rows[0]?.count || 0, 10);
    if (count < 5) {
      console.log('📦 Marketplace listings sparse or empty, seeding authentic German marketplace data...');
      seedMarketplaceData().catch(e => console.error('Seed error:', e.message));
    }
  })
  .catch(() => {});

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for reverse proxies (Render, Railway, Nginx, Vercel, Cloudflare, etc.)
app.set('trust proxy', 1);

app.use(cors());

// Stripe webhook requires raw unparsed body for cryptographic signature verification
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());

// Ensure uploads directory exists and serve static files with CORS
const uploadsPath = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', cors(), express.static(uploadsPath));

app.get('/', (req, res) => {
  res.send(`API Working on port ${PORT}`);
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', authRoutes);
app.use('/api', contactRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/broadcasts', broadcastRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/admin', adminRoutes);

// 404 Not Found Handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Endpunkt nicht gefunden: ${req.method} ${req.originalUrl}`
  });
});

// Global error handling middleware (handles Multer, JWT, Prisma, Syntax and general errors)
app.use((err, req, res, next) => {
  // Multer & File Upload Errors
  if (err.name === 'MulterError' || err.code === 'LIMIT_FILE_SIZE') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'Die Datei ist zu groß. Maximale Dateigröße ist 5 MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Dateiupload-Fehler: ${err.message}`
    });
  }

  // JSON Body Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Ungültiges JSON-Format im Anfrage-Body.'
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Ungültiges Authentifizierungs-Token.'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.'
    });
  }

  // Database Unique Constraint or Record Errors
  if (err.code === '23505' || err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Ein Eintrag mit diesen Daten existiert bereits.'
    });
  }

  const statusCode = err.status || err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  console.error(`[Server Error] [${req.method} ${req.originalUrl}] [${statusCode}]:`, err);

  return res.status(statusCode).json({
    success: false,
    error: err.message || 'Ein unerwarteter Serverfehler ist aufgetreten.',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Crash prevention handlers to keep server alive
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

const httpServer = http.createServer(app);

// Initialize WebSocket Socket.IO Realtime Engine
initSocketServer(httpServer);

const server = httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} with Realtime WebSockets active`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// Graceful cleanup for nodemon and process restarts
const cleanup = () => {
  server.close(() => {
    pool.end().catch(() => {}).finally(() => {
      process.exit(0);
    });
  });
};
process.once('SIGUSR2', cleanup);
process.once('SIGINT', cleanup);
process.once('SIGTERM', cleanup);

export default app;
