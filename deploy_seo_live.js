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
  'index.html',
  'public/robots.txt',
  'public/sitemap.xml',
  'server/admin.js',
  'server/database.js',
  'server/index.js',
  'server/products.js',
  'server/sitemap-generator.js',
  'src/App.tsx',
  'src/admin/components/ProductForm.tsx',
  'src/admin/components/Sidebar.tsx',
  'src/admin/pages/SeoAdmin.tsx',
  'src/components/CategoryShowcase.tsx',
  'src/components/ErrorBoundary.tsx',
  'src/components/Footer.tsx',
  'src/components/Header.tsx',
  'src/components/HomePage.jsx',
  'src/components/MembershipForm.tsx',
  'src/components/MembershipPage.jsx',
  'src/components/MembershipPlans.tsx',
  'src/components/PrivacyPage.tsx',
  'src/components/ShippingPage.tsx',
  'src/components/TermsPage.tsx',
  'src/components/shop/ProductDetailPage.tsx',
  'src/components/shop/ShopCartPage.tsx',
  'src/components/shop/ShopPage.tsx',
  'src/styles/Header.css',
  'src/types/admin.ts',
  'src/utils/categorySlug.ts',
  'src/utils/shopApi.ts',
  'src/utils/usePageSeo.ts',
];

async function main() {
  console.log('=== STEP 1: Connecting to Production VPS (198.38.84.179) ===');
  await ssh.connect({
    host: '198.38.84.179',
    username: 'root',
    password: 'KP7ZFg9zlsLYpj4L',
    readyTimeout: 30000
  });
  console.log('✓ SSH Connected successfully to VPS');

  const remoteDir = '/var/www/nivaran';

  console.log('\n=== STEP 2: Uploading modified and new source files ===');
  for (const relPath of filesToUpload) {
    if (!fs.existsSync(relPath)) {
      console.warn(`Local file does not exist: ${relPath}`);
      continue;
    }
    const remotePath = `${remoteDir}/${relPath.replace(/\\/g, '/')}`;
    const remoteParent = path.dirname(remotePath).replace(/\\/g, '/');
    
    // Ensure parent directory exists on remote
    await ssh.execCommand(`mkdir -p "${remoteParent}"`);
    await ssh.putFile(relPath, remotePath);
    console.log(`✓ Uploaded: ${relPath} -> ${remotePath}`);
  }

  console.log('\n=== STEP 3: Building Frontend on VPS ===');
  const buildResult = await ssh.execCommand(`
    cd ${remoteDir}
    echo "Running npm run build..."
    npm run build
    echo "Syncing public sitemap and robots into dist..."
    cp -f public/sitemap.xml dist/sitemap.xml
    cp -f public/robots.txt dist/robots.txt
  `);
  console.log(buildResult.stdout);
  if (buildResult.stderr) {
    console.log('Build warnings/stderr:', buildResult.stderr);
  }

  console.log('\n=== STEP 4: Restarting PM2 Backend & Reloading Nginx ===');
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

  console.log('\n=== STEP 5: Live Production Verification Tests ===');
  const tests = [
    { name: 'Home Page', url: 'https://nivaranupcyclers.com/' },
    { name: 'Shop All Products', url: 'https://nivaranupcyclers.com/products' },
    { name: 'Category: Bags', url: 'https://nivaranupcyclers.com/products/bags' },
    { name: 'Category: Bamboo', url: 'https://nivaranupcyclers.com/products/bamboo-products' },
    { name: 'Robots.txt', url: 'https://nivaranupcyclers.com/robots.txt' },
    { name: 'Sitemap.xml', url: 'https://nivaranupcyclers.com/sitemap.xml' },
    { name: 'Public Page SEO API', url: 'https://nivaranupcyclers.com/api/page-seo' },
    { name: 'Previous City SEO Page', url: 'https://nivaranupcyclers.com/DEL/eco-friendly-corporate-gifts' },
  ];

  for (const t of tests) {
    const res = await fetchUrl(t.url);
    const pass = res.statusCode >= 200 && res.statusCode < 400;
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${t.name}: ${t.url} -> Status: ${res.statusCode} (Length: ${res.body?.length || 0})`);
    if (t.name === 'Robots.txt') {
      console.log('   robots.txt snippet:', res.body.slice(0, 100).replace(/\n/g, ' '));
    }
    if (t.name === 'Public Page SEO API') {
      console.log('   page-seo api snippet:', res.body.slice(0, 100));
    }
    if (t.name === 'Sitemap.xml') {
      const hasBags = res.body.includes('/products/bags');
      console.log(`   sitemap contains /products/bags: ${hasBags ? 'YES' : 'NO'}`);
    }
  }

  console.log('\n=== ALL DEPLOYMENT & VERIFICATION COMPLETED ===');
}

main().catch((err) => {
  console.error('Deployment error:', err);
  process.exit(1);
});
