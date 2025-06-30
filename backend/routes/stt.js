const express = require('express');
const multer = require('multer');
const router = express.Router();
const { elevenlabs } = require('../config/elevenlabs');
const { verifyToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Speech-to-text endpoint
router.post('/transcribe', verifyToken, upload.single('file'), async (req, res) => {
  const { model_id = 'scribe_v1', language_code } = req.body;

  if (!req.file?.buffer) {
    return res.status(400).json({ error: 'Audio file is required' });
  }

  try {
    // Upload to Supabase first
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-uploads')
      .upload(`${Date.now()}-audio`, req.file.buffer, {
        contentType: req.file.mimetype
      });
    if (uploadError) throw uploadError;

    const transcription = await elevenlabs.speechToText({
      model_id,
      file_url: `${process.env.SUPABASE_URL}/storage/v1/object/public/audio-uploads/${uploadData.path}`,
      language_code
    });

    // Clean up after processing
    await supabase.storage
      .from('audio-uploads')
      .remove([uploadData.path]);
    
    res.json(transcription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;