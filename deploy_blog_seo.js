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
  'server/database.js',
  'server/blogs.js',
  'server/sitemap-generator.js',
  'src/utils/blogFormatter.ts',
  'src/components/BlogPostPage.tsx',
  'src/admin/pages/BlogsAdmin.tsx',
];

async function main() {
  console.log('=== STEP 1: Connecting to Production VPS (198.38.84.179) ===');
  await ssh.connect({
    host: '198.38.84.179',
    username: 'root',
    password: 'KP7ZFg9zlsLYpj4L',
    readyTimeout: 30000
  });
  console.log('✓ SSH Connected successfully');

  const remoteDir = '/var/www/nivaran';

  console.log('\n=== STEP 2: Running PostgreSQL Schema Migrations for Blogs SEO ===');
  const sqlMigration = `
    ALTER TABLE blogs ADD COLUMN IF NOT EXISTS meta_title TEXT;
    ALTER TABLE blogs ADD COLUMN IF NOT EXISTS meta_description TEXT;
    ALTER TABLE blogs ADD COLUMN IF NOT EXISTS canonical_url TEXT;

    -- Backfill existing blog #7 (Pooja Waste Disposal in Kanpur)
    UPDATE blogs 
    SET 
      meta_title = COALESCE(NULLIF(meta_title, ''), 'Pooja Waste Disposal in Kanpur: Where and How to Do It Right | Nivaran Upcyclers'),
      meta_description = COALESCE(NULLIF(meta_description, ''), 'Learn how to responsibly dispose of pooja waste and religious flower offerings in Kanpur. Nivaran Upcyclers recycles pooja flowers into sustainable products.'),
      canonical_url = COALESCE(NULLIF(canonical_url, ''), 'https://nivaranupcyclers.com/blogs/news/pooja-waste-disposal-in-kanpur')
    WHERE handle = 'pooja-waste-disposal-in-kanpur';

    -- Backfill blog #1
    UPDATE blogs 
    SET 
      meta_title = COALESCE(NULLIF(meta_title, ''), 'Sustainable Living: Transform Your Home | Nivaran Upcyclers'),
      meta_description = COALESCE(NULLIF(meta_description, ''), 'Discover how upcycled products can transform your living space into an eco-friendly haven. Learn practical tips for sustainable home decor.'),
      canonical_url = COALESCE(NULLIF(canonical_url, ''), 'https://nivaranupcyclers.com/blogs/news/sustainable-living-transform-home')
    WHERE handle = 'sustainable-living-transform-home';

    -- Backfill blog #2
    UPDATE blogs 
    SET 
      meta_title = COALESCE(NULLIF(meta_title, ''), 'The Art of Upcycling: Creative Techniques | Nivaran Upcyclers'),
      meta_description = COALESCE(NULLIF(meta_description, ''), 'Explore the creative world of upcycling and learn techniques to turn waste materials into beautiful, functional art pieces for your home.'),
      canonical_url = COALESCE(NULLIF(canonical_url, ''), 'https://nivaranupcyclers.com/blogs/news/art-of-upcycling-techniques')
    WHERE handle = 'art-of-upcycling-techniques';

    -- Backfill blog #3
    UPDATE blogs 
    SET 
      meta_title = COALESCE(NULLIF(meta_title, ''), 'Community Impact: Stories of Change | Nivaran Upcyclers'),
      meta_description = COALESCE(NULLIF(meta_description, ''), 'Read inspiring stories from our community members who have embraced sustainable living and made a positive impact on the environment.'),
      canonical_url = COALESCE(NULLIF(canonical_url, ''), 'https://nivaranupcyclers.com/blogs/news/community-impact-stories')
    WHERE handle = 'community-impact-stories';

    -- Backfill any remaining blogs canonical_url if null
    UPDATE blogs 
    SET canonical_url = 'https://nivaranupcyclers.com/blogs/news/' || handle
    WHERE canonical_url IS NULL OR canonical_url = '';
  `;

  const migrationRes = await ssh.execCommand(`sudo -u postgres psql -d nivaran_db -c "${sqlMigration.replace(/"/g, '\\"')}"`);
  console.log('PostgreSQL Migration Output:\n', migrationRes.stdout);
  if (migrationRes.stderr) console.log('Migration Stderr:', migrationRes.stderr);

  console.log('\n=== STEP 3: Uploading New & Modified Files ===');
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
    console.log(`✓ Uploaded: ${relPath} -> ${remotePath}`);
  }

  console.log('\n=== STEP 4: Building Frontend on VPS ===');
  const buildResult = await ssh.execCommand(`
    cd ${remoteDir}
    echo "Running npm run build..."
    npm run build
    echo "Syncing public sitemap and robots into dist..."
    cp -f public/sitemap.xml dist/sitemap.xml 2>/dev/null || true
    cp -f public/robots.txt dist/robots.txt 2>/dev/null || true
  `);
  console.log(buildResult.stdout);
  if (buildResult.stderr) {
    console.log('Build warnings/stderr:', buildResult.stderr);
  }

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
  console.log('\n✓ VPS Deployment finished. Waiting 5s for services to stabilize...');
  await new Promise(r => setTimeout(r, 5000));

  console.log('\n=== STEP 6: Verification ===');
  const blogApiRes = await fetchUrl('https://nivaranupcyclers.com/api/blogs/article/pooja-waste-disposal-in-kanpur');
  console.log(`[API Blog Status]: ${blogApiRes.statusCode}`);
  try {
    const blogData = JSON.parse(blogApiRes.body);
    console.log(`  Title: ${blogData.title}`);
    console.log(`  Meta Title: ${blogData.meta_title}`);
    console.log(`  Meta Description: ${blogData.meta_description}`);
    console.log(`  Canonical URL: ${blogData.canonical_url}`);
  } catch (e) {
    console.error('Failed to parse blog API JSON:', blogApiRes.body.slice(0, 200));
  }

  const blogPageRes = await fetchUrl('https://nivaranupcyclers.com/blogs/news/pooja-waste-disposal-in-kanpur');
  console.log(`\n[Blog Page HTML Status]: ${blogPageRes.statusCode} (Length: ${blogPageRes.body?.length || 0})`);

  const sitemapRes = await fetchUrl('https://nivaranupcyclers.com/sitemap.xml');
  console.log(`[Sitemap.xml Status]: ${sitemapRes.statusCode}`);
  const hasPoojaInSitemap = sitemapRes.body?.includes('/blogs/news/pooja-waste-disposal-in-kanpur');
  console.log(`  Contains pooja-waste-disposal-in-kanpur: ${hasPoojaInSitemap ? 'YES' : 'NO'}`);

  console.log('\n=== DEPLOYMENT AND VERIFICATION COMPLETE ===');
}

main().catch((err) => {
  console.error('Error during deployment:', err);
  process.exit(1);
});
