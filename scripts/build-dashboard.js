const { execSync } = require('child_process');
require('dotenv').config();

const url = process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || '';
const fbAppId = process.env.FB_APP_ID || '';

execSync(
  `esbuild src/dashboard/index.js --bundle --minify ` +
  `"--define:process.env.SUPABASE_URL=\\"${url}\\"" ` +
  `"--define:process.env.SUPABASE_ANON_KEY=\\"${key}\\"" ` +
  `--outfile=public/dashboard.js`,
  { stdio: 'inherit' }
);

// Replace FB_APP_ID placeholder in the built file
const fs = require('fs');
let content = fs.readFileSync('public/dashboard.js', 'utf8');
content = content.replace('{{FB_APP_ID}}', fbAppId);
fs.writeFileSync('public/dashboard.js', content);
