require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes        = require('./routes/auth.routes');
const courseRoutes      = require('./routes/course.routes');
const enrollmentRoutes  = require('./routes/enrollment.routes');
const progressRoutes    = require('./routes/progress.routes');
const userRoutes        = require('./routes/user.routes');
const certificateRoutes = require('./routes/certificate.routes');
const uploadRoutes      = require('./routes/upload.routes');
const aiRoutes          = require('./routes/ai.routes');

const app = express();

connectDB();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = [process.env.APP_URL].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');
    allowed ? callback(null, true) : callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

if (process.env.NODE_ENV === 'production') {
  app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 500, message: 'Too many requests' }));
}

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth',         authRoutes);
app.use('/api/courses',      courseRoutes);
app.use('/api/enrollments',  enrollmentRoutes);
app.use('/api/progress',     progressRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/upload',       uploadRoutes);
app.use('/api/ai',           aiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
