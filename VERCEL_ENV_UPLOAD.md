# 📋 How to Upload Environment Variables to Vercel

## Method 1: Copy-Paste (Easiest - 2 minutes)

1. **Go to:** https://vercel.com/vidyasagars-projects-414a8af3/nivaran3.1/settings/environment-variables

2. **Click "Add New"** and paste each line:

```
VITE_SHOPIFY_STORE_URL=nivaranupcyclers.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=
VITE_SHOPIFY_API_VERSION=2024-01
VITE_GOOGLE_CLIENT_ID=
VITE_API_URL=https://niraran-4-1.onrender.com
```

3. **For each variable:**
   - Name: (before the =)
   - Value: (after the =)
   - Environment: Production ✓
   - Click "Save"

4. **After all 5 are added:**
   - Go to: https://vercel.com/vidyasagars-projects-414a8af3/nivaran3.1/deployments
   - Click **...** on latest deployment
   - Click **Redeploy**

---

## Method 2: Bulk Import (If Available)

Some Vercel projects have a "Bulk Import" option:

1. Go to environment variables page
2. Look for "Bulk Import" or "Import .env" button
3. If available, paste the entire content from `.env.production` file
4. Click Import

---

## Method 3: Via Vercel CLI Pull/Push

```bash
# This creates a .env.local file with current values
vercel env pull .env.local

# Edit the file with your values, then:
vercel env push .env.production production
```

---

## ✅ After Adding Variables:

**Redeploy:**
```bash
vercel --prod
```

**Or via dashboard:**
- Deployments → ... → Redeploy

---

## 🎯 Your Environment Variables:

**File created:** `.env.production`

**Contains:**
- VITE_SHOPIFY_STORE_URL
- VITE_SHOPIFY_STOREFRONT_TOKEN  
- VITE_SHOPIFY_API_VERSION
- VITE_GOOGLE_CLIENT_ID
- VITE_API_URL

**All set with correct values!**

---

**Recommended:** Use Method 1 (copy-paste) - it's the fastest and most reliable! 🚀
