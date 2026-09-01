import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import creditRoutes from './routes/credit.js';
import referralRoutes from './routes/referral.js';
import listingRoutes from './routes/listings.js';
import subscriptionRoutes from './routes/subscription.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

app.get('/', (req, res) => {
  res.send(`API Working on port ${PORT}`);
});

app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/credits', creditRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

