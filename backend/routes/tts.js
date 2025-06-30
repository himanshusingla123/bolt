const express = require('express');
const router = express.Router();
const { elevenlabs } = require('../config/elevenlabs');
const { verifyToken } = require('../middleware/auth');

// Get available voices
router.get('/voices', verifyToken, async (req, res) => {
  try {
    const voices = await elevenlabs.voices.getAll();
    res.json(voices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Text-to-speech conversion
router.post('/text-to-speech', verifyToken, async (req, res) => {
  const { text, voice_id } = req.body;
  
  if (!voice_id) {
    return res.status(400).json({ error: 'voice_id is required' });
  }

  try {
    const audio = await elevenlabs.generate({
      voice: voice_id,
      text,
      model_id: 'eleven_multilingual_v2'
    });
    
    res.set('Content-Type', 'audio/mpeg');
    res.send(audio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;