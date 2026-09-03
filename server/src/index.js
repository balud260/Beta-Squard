const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const problemRoutes = require('./routes/problemRoutes');
const proposalRoutes = require('./routes/proposalRoutes');
const projectRoutes = require('./routes/projectRoutes');
const disasterRoutes = require('./routes/disasterRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const universityRoutes = require('./routes/universityRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const impactRoutes = require('./routes/impactRoutes');
const aiRoutes = require('./routes/aiRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/disasters', disasterRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/universities', universityRoutes);
app.use('/api/university', universityRoutes);

app.use('/api/notifications', notificationRoutes);
app.use('/api/impact', impactRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/students', studentRoutes);

// Health & Status Check Endpoints (Root & /health)
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sankalp-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sankalp-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sankalp-api',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static files in production if needed
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Controlled Error Handler
app.use((err, req, res, next) => {
  console.error('Express Error:', err.message);
  res.status(500).json({
    error: 'Internal server error occurred.',
    message: err.message
  });
});

async function startServer() {
  await db.initPromise;
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '');
  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  SANKALP AI Backend API running on port ${PORT}`);
    console.log(`  Database: Pure JS SQLite (solvelink.db) Initialized`);
    console.log(`  Gemini AI Engine: ${hasGeminiKey ? 'AVAILABLE (gemini-3.6-flash)' : 'MISSING (Fallback protection active)'}`);
    console.log(`=======================================================`);
  });
}

startServer();

