const { NodeSSH } = require('node-ssh');
const path = require('path');
const ssh = new NodeSSH();

async function deployFixes() {
  try {
    console.log('Connecting to VPS (198.38.84.179)...');
    await ssh.connect({
      host: '198.38.84.179',
      username: 'root',
      password: 'KP7ZFg9zlsLYpj4L'
    });
    console.log('Connected successfully!');

    const remoteDir = '/var/www/nivaran';

    // 1. Ensure remote directories exist
    console.log('Ensuring directories...');
    await ssh.execCommand(`mkdir -p ${remoteDir}/public/images/hero ${remoteDir}/dist/images/hero ${remoteDir}/src/components/shop`);

    // 2. Upload images
    console.log('Uploading hero banner & founder images...');
    await ssh.putFile('public/images/hero/hero-banner-upcycled.jpg', `${remoteDir}/public/images/hero/hero-banner-upcycled.jpg`);
    await ssh.putFile('public/images/hero/hero-banner-upcycled.jpg', `${remoteDir}/dist/images/hero/hero-banner-upcycled.jpg`);
    await ssh.putFile('public/images/hero/hero-founder-process.png', `${remoteDir}/public/images/hero/hero-founder-process.png`);
    await ssh.putFile('public/images/hero/hero-founder-process.png', `${remoteDir}/dist/images/hero/hero-founder-process.png`);
    console.log('Images uploaded!');

    // 3. Update database: fix hero slides in postgres and sqlite
    console.log('Updating database hero slides...');
    const dbUpdateCmd = `
      sudo -u postgres psql -d nivaran_db -c "UPDATE hero_slides SET image = '/images/hero/hero-banner-upcycled.jpg', primary_cta = 'Shop Now', secondary_cta = 'Learn More' WHERE id = 7;" 2>/dev/null || true
      sudo -u postgres psql -d nivaran_db -c "UPDATE hero_slides SET image = '/images/hero/hero-founder-process.png' WHERE id = 1;" 2>/dev/null || true
      if [ -f /var/www/nivaran/server/nivaran.db ]; then
        sqlite3 /var/www/nivaran/server/nivaran.db "UPDATE hero_slides SET image = '/images/hero/hero-banner-upcycled.jpg', primary_cta = 'Shop Now', secondary_cta = 'Learn More' WHERE id = 7;" 2>/dev/null || true
        sqlite3 /var/www/nivaran/server/nivaran.db "UPDATE hero_slides SET image = '/images/hero/hero-founder-process.png' WHERE id = 1;" 2>/dev/null || true
      fi
      if [ -f /var/www/nivaran/nivaran.db ]; then
        sqlite3 /var/www/nivaran/nivaran.db "UPDATE hero_slides SET image = '/images/hero/hero-banner-upcycled.jpg', primary_cta = 'Shop Now', secondary_cta = 'Learn More' WHERE id = 7;" 2>/dev/null || true
        sqlite3 /var/www/nivaran/nivaran.db "UPDATE hero_slides SET image = '/images/hero/hero-founder-process.png' WHERE id = 1;" 2>/dev/null || true
      fi
    `;
    const dbRes = await ssh.execCommand(dbUpdateCmd);
    console.log('DB Update result:', dbRes.stdout);

    // 4. Upload updated source files
    console.log('Uploading updated source code...');
    const files = [
      'src/components/HeroSlideshow.jsx',
      'src/components/shop/ShareProductModal.tsx',
      'src/components/shop/ProductDetailPage.tsx',
      'src/components/shop/ShopPage.tsx',
      'src/admin/components/ProductTable.tsx',
      'src/styles/ProductDetailPage.css',
    ];

    for (const f of files) {
      console.log(`Uploading ${f}...`);
      await ssh.putFile(f, `${remoteDir}/${f}`);
    }

    // 5. Build on server & restart
    console.log('Building on VPS...');
    const buildRes = await ssh.execCommand(`cd ${remoteDir} && npm run build && pm2 restart nivaran-api || pm2 restart all`);
    console.log('Build output:', buildRes.stdout);
    if (buildRes.stderr) console.error('Build stderr:', buildRes.stderr);

    // 6. Verify hero slides API
    console.log('Verifying hero slides API...');
    const verifyApi = await ssh.execCommand(`curl -s http://localhost:5000/api/hero-slides | head -c 300`);
    console.log('API output:', verifyApi.stdout);

    console.log('Deployment completed successfully!');
    ssh.dispose();
  } catch (err) {
    console.error('Deployment error:', err);
    ssh.dispose();
  }
}

deployFixes();
