const express = require('express');

// Health check endpoint for Render
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const ttsRoutes = require('./routes/tts');
const sttRoutes = require('./routes/stt');
const dubbingRoutes = require('./routes/dubbing');
require('dotenv').config();

const app = express();

// Health check endpoint for Render
app.get('/health', (req, res) => res.sendStatus(200));

// Configure CORS to allow WebContainer and local development
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and WebContainer origins
    const allowedOrigins = [
      'http://localhost:5173',
      'https://localhost:5173',
      'http://127.0.0.1:5173',
      'https://127.0.0.1:5173'
    ];
    
    // Allow any WebContainer origin (they have specific patterns)
    if (origin.includes('.webcontainer-api.io') || 
        origin.includes('.local-credentialless.webcontainer-api.io') ||
        allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/auth', authRoutes);
app.use('/tts', ttsRoutes);
app.use('/stt', sttRoutes);
app.use('/dubbing', dubbingRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});