const { NodeSSH } = require('node-ssh');
const https = require('https');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

function fetchUrl(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NivaranSeoVerifier/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', (err) => {
      resolve({ error: err.message, statusCode: 500 });
    });
  });
}

const filesToUpload = [
  'server/sitemap-generator.js',
  'server/blogs.js',
  'src/components/BlogPostPage.tsx',
  'src/admin/pages/BlogsAdmin.tsx',
];

async function main() {
  console.log('=== STEP 1: Connecting to Production VPS ===');
  await ssh.connect({
    host: '198.38.84.179',
    username: 'root',
    password: 'KP7ZFg9zlsLYpj4L',
    readyTimeout: 30000
  });
  console.log('✓ SSH Connected');

  console.log('\n=== STEP 2: Updating Blog Canonical URLs in PostgreSQL ===');
  const sqlUpdate = `
    UPDATE blogs 
    SET canonical_url = 'https://www.nivaranupcyclers.com/blogs/news/pooja-waste-disposal-collection-services-in-india' 
    WHERE handle = 'pooja-waste-disposal-collection-services-in-india';

    UPDATE blogs 
    SET canonical_url = 'https://www.nivaranupcyclers.com/blogs/news/' || handle 
    WHERE canonical_url IS NULL OR canonical_url = '' OR canonical_url NOT LIKE 'http%';

    SELECT id, title, handle, canonical_url FROM blogs ORDER BY id ASC;
  `;
  const dbRes = await ssh.execCommand(`sudo -u postgres psql -d nivaran_db -c "${sqlUpdate.replace(/"/g, '\\"')}"`);
  console.log('PostgreSQL Output:\n', dbRes.stdout);

  const remoteDir = '/var/www/nivaran';

  console.log('\n=== STEP 3: Uploading Modified Files ===');
  for (const relPath of filesToUpload) {
    const localPath = path.resolve(__dirname, relPath);
    if (!fs.existsSync(localPath)) {
      console.warn(`Local file does not exist: ${localPath}`);
      continue;
    }
    const remotePath = `${remoteDir}/${relPath.replace(/\\/g, '/')}`;
    const remoteParent = path.dirname(remotePath).replace(/\\/g, '/');
    
    await ssh.execCommand(`mkdir -p "${remoteParent}"`);
    await ssh.putFile(localPath, remotePath);
    console.log(`✓ Uploaded: ${relPath}`);
  }

  console.log('\n=== STEP 4: Building Frontend on VPS ===');
  const buildResult = await ssh.execCommand(`
    cd ${remoteDir}
    npm run build
    cp -f public/sitemap.xml dist/sitemap.xml 2>/dev/null || true
    cp -f public/robots.txt dist/robots.txt 2>/dev/null || true
  `);
  console.log(buildResult.stdout);
  if (buildResult.stderr) console.log('Build warnings:', buildResult.stderr);

  console.log('\n=== STEP 5: Restarting PM2 Backend & Reloading Nginx ===');
  const restartResult = await ssh.execCommand(`
    cd ${remoteDir}
    pm2 restart nivaran-api || pm2 restart all
    systemctl reload nginx || systemctl restart nginx
    sleep 3
    pm2 status
  `);
  console.log(restartResult.stdout);

  ssh.dispose();
  console.log('Waiting 5s for services to stabilize...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== STEP 6: Live Production Verification ===');
  const sitemapRes = await fetchUrl('https://nivaranupcyclers.com/sitemap.xml');
  console.log(`[Sitemap.xml]: Status ${sitemapRes.statusCode}`);
  const hasTarget = sitemapRes.body?.includes('https://www.nivaranupcyclers.com/blogs/news/pooja-waste-disposal-collection-services-in-india');
  console.log(`  Contains target blog full URL: ${hasTarget ? 'YES' : 'NO'}`);

  const lines = (sitemapRes.body || '').split('\n').filter(l => l.includes('/blogs/news/'));
  console.log(`  Total blog URLs in sitemap: ${lines.length}`);
  lines.forEach(l => console.log('   ', l.trim()));

  // Sanity check previous SEO
  const previousChecks = [
    'https://nivaranupcyclers.com/robots.txt',
    'https://nivaranupcyclers.com/products/bags',
    'https://nivaranupcyclers.com/DEL/eco-friendly-corporate-gifts',
    'https://nivaranupcyclers.com/blogs/news/pooja-waste-disposal-collection-services-in-india'
  ];
  for (const url of previousChecks) {
    const res = await fetchUrl(url);
    console.log(`  [Sanity ${res.statusCode}] ${url}`);
  }

  console.log('\n=== ALL DEPLOYMENT & VERIFICATION COMPLETED ===');
}

main().catch(console.error);
