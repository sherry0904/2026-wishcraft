const fs = require('fs');
const path = require('path');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir('server/api');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  if (content.includes('serverSupabaseClient')) {
    content = content.replace("import { serverSupabaseClient } from '#supabase/server'", "import { createClient } from '@supabase/supabase-js'");
    content = content.replace(/const client = await serverSupabaseClient\(event\)/g, "const config = useRuntimeConfig()\n    const client = createClient(config.public.supabase.url, config.public.supabase.key)");
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
  }
});
