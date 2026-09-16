import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import creditRoutes from './routes/credit.js';
import referralRoutes from './routes/referral.js';
import listingRoutes from './routes/listings.js';
import subscriptionRoutes from './routes/subscription.js';
import favoritesRoutes from './routes/favorites.js';
import adminRoutes from './routes/admin.js';
import conversationRoutes from './routes/conversations.js';
import './config/initAdminTable.js';
import './config/initChatTables.js';
import pool from './config/database.js';
import { seedMarketplaceData } from './config/seedMarketplaceData.js';

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

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send(`API Working on port ${PORT}`);
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/admin', adminRoutes);

// Global error handling middleware (handles Multer errors and others)
app.use((err, req, res, next) => {
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
  if (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Ein interner Serverfehler ist aufgetreten.'
    });
  }
  next();
});

// Crash prevention handlers to keep server alive
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process. Please close that process first.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

export default app;
