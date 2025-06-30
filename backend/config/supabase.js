require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Create client with anon key for regular operations
const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'storage' }
});

// Create admin client with service role key for admin operations
const supabaseAdmin = createClient(
  supabaseUrl, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

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

module.exports = { supabase, supabaseAdmin, initStorage };