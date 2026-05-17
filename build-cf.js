const { execSync } = require('child_process');

const vars = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://zszvnsqozyaaxbpqpnrp.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzenZuc3FvenlhYXhicHFwbnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MzA5OTUsImV4cCI6MjA5NDMwNjk5NX0.XdLqZoKkIMngIeL6MAiO4v6iuHSvrfJ1wJi-B05mEOw',
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 'dotgtlphj',
  NEXT_PUBLIC_WHATSAPP_ADMIN: '59173394005',
  SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzenZuc3FvenlhYXhicHFwbnJwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODczMDk5NSwiZXhwIjoyMDk0MzA2OTk1fQ.E5mmi-F55CwLI79IwXGe-yWe4W9lDLRRL67bktVzHv0'
};

const env = { ...process.env, ...vars };

console.log('Building for Cloudflare Workers...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', vars.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME:', vars.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

try {
  // First run npm install with legacy peer deps
  console.log('Installing dependencies...');
  execSync('npm install --legacy-peer-deps', { stdio: 'inherit', env, shell: true });

  // Then run opennextjs-cloudflare build with the flag
  console.log('Running OpenNext build...');
  execSync('npx opennextjs-cloudflare build --dangerouslyUseUnsupportedNextVersion', { stdio: 'inherit', env, shell: true });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}