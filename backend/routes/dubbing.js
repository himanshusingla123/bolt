const express = require('express');
const router = express.Router();
const { elevenlabs } = require('../config/elevenlabs');
const { verifyToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Dubbing endpoint
router.post('/create', verifyToken, async (req, res) => {
  const { target_lang, source_lang = 'auto', files } = req.body;

  if (!target_lang || !files) {
    return res.status(400).json({ error: 'target_lang and files are required' });
  }

  try {
    // Upload files to Supabase Storage
    const uploadPromises = Object.entries(files).map(async ([name, file]) => {
      const { data, error } = await supabase.storage
        .from('dubbing-files')
        .upload(`${Date.now()}-${name}`, file.buffer, {
          contentType: file.mimetype
        });
      if (error) throw error;
      return data.path;
    });

    const filePaths = await Promise.all(uploadPromises);
    
    const dubbingResult = await elevenlabs.dubbing.create({
      file_paths: filePaths,
      target_lang,
      source_lang
    });
    
    res.json(dubbingResult);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dubbing metadata
router.get('/:dubbing_id', verifyToken, async (req, res) => {
  const { dubbing_id } = req.params;

  try {
    const metadata = await elevenlabs.dubbing.get(dubbing_id);
    res.json(metadata);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dubbing status (deprecated - use the main endpoint instead)
router.get('/status/:dubbing_id', verifyToken, async (req, res) => {
  const { dubbing_id } = req.params;

  try {
    const status = await elevenlabs.dubbing.getStatus(dubbing_id);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete dubbing project
router.delete('/:dubbing_id', verifyToken, async (req, res) => {
  const { dubbing_id } = req.params;

  try {
    const result = await elevenlabs.dubbing.delete(dubbing_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;