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

// Universal CORS configuration - allows all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false
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