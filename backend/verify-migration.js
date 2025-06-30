const { supabase } = require('./config/supabase');

async function verify() {
  const { data, error } = await supabase.storage
    .from('dubbing-files')
    .list('migrated');
  
  if (error) {
    console.error('Verification failed:', error.message);
    return;
  }
  console.log(`${data.length} files migrated successfully`);
  data.forEach(file => console.log(`- ${file.name}`));
}

verify();