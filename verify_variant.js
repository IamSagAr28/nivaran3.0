const https = require('https');

const SHOPIFY_DOMAIN = process.env.SHOPIFY_DOMAIN || process.env.VITE_SHOPIFY_STORE_DOMAIN || process.env.VITE_SHOPIFY_STORE_URL;
const ACCESS_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || process.env.VITE_SHOPIFY_STOREFRONT_TOKEN || process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

if (!SHOPIFY_DOMAIN || !ACCESS_TOKEN) {
  console.error('Missing env vars. Set SHOPIFY_DOMAIN and SHOPIFY_STOREFRONT_TOKEN (or VITE_SHOPIFY_* equivalents).');
  process.exit(1);
}

const query = `
query getVariants {
  node(id: "gid://shopify/ProductVariant/51034847543584") {
    ... on ProductVariant {
      id
      title
      availableForSale
      price {
        amount
        currencyCode
      }
      product {
        title
        handle
      }
    }
  }
}
`;

const options = {
    hostname: SHOPIFY_DOMAIN,
    path: '/api/2024-01/graphql.json',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': ACCESS_TOKEN
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Body:', data);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(JSON.stringify({ query }));
req.end();
