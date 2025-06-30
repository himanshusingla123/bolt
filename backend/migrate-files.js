const fs = require('fs');
const path = require('path');
const { supabase } = require('./config/supabase');

async function migrateFiles() {
  const uploadDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadDir)) return;

  const files = fs.readdirSync(uploadDir);
  for (const file of files) {
    const buffer = fs.readFileSync(path.join(uploadDir, file));
    await supabase.storage
      .from('dubbing-files')
      .upload(`migrated/${file}`, buffer);
  }
}
migrateFiles();