import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env.js';
import { connectDB, dbStatus } from './config/db.js';
import { initStoreData } from './models/store.js';
import { getSeedData } from './services/seedData.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import capacityRoutes from './routes/capacityRoutes.js';
import assignmentRoutes from './routes/assignmentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import fairnessRoutes from './routes/fairnessRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import seedRoutes from './routes/seedRoutes.js';

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Health Check & Documentation
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'K-12 Education Workforce Skill & Capacity Intelligence Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbStatus,
    aiEngine: {
      provider: 'Google Gemini Generative AI',
      model: ENV.GEMINI_MODEL,
      liveKeyConfigured: Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY !== 'your_google_gemini_api_key_here')
    }
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/workers', workerRoutes);
app.use('/api/v1/capacity', capacityRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/fairness', fairnessRoutes);
app.use('/api/v1/learning', learningRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/audit', auditRoutes);
app.use('/api/v1/seed', seedRoutes);

// Global error handler
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();
  initStoreData(getSeedData());

  app.listen(ENV.PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 EduStaff IQ API Server running on port ${ENV.PORT}`);
    console.log(`🔗 Health Check: http://localhost:${ENV.PORT}/api/v1/health`);
    console.log(`🤖 AI Model: ${ENV.GEMINI_MODEL}`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error('[Server Fatal]', err);
  process.exit(1);
});
