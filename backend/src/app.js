require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const courseRoutes = require('./routes/course.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const progressRoutes = require('./routes/progress.routes');

const userRoutes = require('./routes/user.routes');
const aiRoutes = require('./routes/ai.routes');
const certificateRoutes = require('./routes/certificate.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// Connect to MongoDB
connectDB();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false, // Disable for easier development with cross-origin resources
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.ADMIN_URL || 'http://localhost:3001',
    process.env.TUTOR_URL || 'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3000', // Unified portal
    'http://localhost:5173', // Vite default dev server
    'http://localhost:5174', // Vite alternative port
  ],
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting (disabled in development)
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 1000, // Limit each IP to 1000 requests per windowMs (generous for dev)
//   message: 'Too many requests from this IP, please try again later.',
// });

// Only enable rate limiting in production
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/progress', progressRoutes);

app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/upload', uploadRoutes);
// Additional routes will be added as we build them

// 404 handler
app.use(notFound);

// Global error handler (must be last)
app.use(errorHandler);

module.exports = app;
