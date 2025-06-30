require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Add validation for required environment variables
if (!supabaseUrl) {
  throw new Error('SUPABASE_URL environment variable is required');
}

if (!supabaseKey) {
  throw new Error('SUPABASE_KEY environment variable is required');
}

// Create client with proper configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Set to false for server-side usage
    detectSessionInUrl: false
  },
  db: {
    schema: 'public' // Changed from 'storage' to 'public' as default
  }
});

const initStorage = async () => {
  try {
    console.log('Initializing Supabase storage...');
    
    // Check if we can connect to Supabase
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error connecting to Supabase storage:', listError);
      throw listError;
    }

    console.log('Connected to Supabase storage successfully');
    console.log('Existing buckets:', buckets?.map(b => b.name) || []);

    // Create dubbing-files bucket if it doesn't exist
    if (!buckets?.some(b => b.name === 'dubbing-files')) {
      console.log('Creating dubbing-files bucket...');
      const { error: createError1 } = await supabase.storage.createBucket('dubbing-files', {
        public: false,
        allowedMimeTypes: ['video/*', 'audio/*'],
        fileSizeLimit: 100 * 1024 * 1024 // 100MB limit
      });
      
      if (createError1) {
        console.error('Error creating dubbing-files bucket:', createError1);
      } else {
        console.log('dubbing-files bucket created successfully');
      }
    }

    // Create audio-uploads bucket if it doesn't exist
    if (!buckets?.some(b => b.name === 'audio-uploads')) {
      console.log('Creating audio-uploads bucket...');
      const { error: createError2 } = await supabase.storage.createBucket('audio-uploads', {
        public: false,
        allowedMimeTypes: ['audio/*'],
        fileSizeLimit: 50 * 1024 * 1024 // 50MB limit
      });
      
      if (createError2) {
        console.error('Error creating audio-uploads bucket:', createError2);
      } else {
        console.log('audio-uploads bucket created successfully');
      }
    }

    console.log('Storage initialization completed');
  } catch (error) {
    console.error('Failed to initialize storage:', error);
    // Don't throw here to prevent app from crashing
  }
};

// Test connection function
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
    if (error && error.code !== 'PGRST116') { // PGRST116 is "table not found" which is OK
      throw error;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return false;
  }
};

module.exports = { supabase, initStorage, testConnection };