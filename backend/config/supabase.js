require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'storage' }
});

const initStorage = async () => {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets.some(b => b.name === 'dubbing-files')) {
    await supabase.storage.createBucket('dubbing-files', {
      public: false,
      allowedMimeTypes: ['video/*', 'audio/*']
    });
  }
  if (!buckets.some(b => b.name === 'audio-uploads')) {
    await supabase.storage.createBucket('audio-uploads', {
      public: false,
      allowedMimeTypes: ['audio/*']
    });
  }
};

module.exports = { supabase, initStorage };