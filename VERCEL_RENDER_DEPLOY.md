# Vercel + Render Deployment Guide - Step by Step

## Part 1: Deploy Frontend to Vercel (10 minutes)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```
- Choose your preferred login method (GitHub recommended)
- Follow the browser prompts to authenticate

### Step 3: Deploy Frontend
```bash
cd c:\Users\sagar\OneDrive\Desktop\newN\nivaran3.1
vercel
```

**Answer the prompts:**
1. "Set up and deploy?" → **Yes (Y)**
2. "Which scope?" → Select your account
3. "Link to existing project?" → **No (N)**
4. "What's your project's name?" → **nivaran-4-1** (or any name)
5. "In which directory is your code located?" → **./** (press Enter)
6. "Want to override settings?" → **No (N)**

Vercel will now build and deploy! Wait for it to finish.

### Step 4: Get Your Vercel URL
After deployment completes, you'll see:
```
✅ Production: https://nivaran-4-1.vercel.app
```
**COPY THIS URL** - you'll need it later!

### Step 5: Add Environment Variables to Vercel

**Option A: Via Vercel Dashboard (Recommended)**
1. Go to https://vercel.com/dashboard
2. Click on your project (`nivaran-4-1`)
3. Go to **Settings** → **Environment Variables**
4. Add these variables (one by one):

```
Name: VITE_SHOPIFY_STORE_URL
Value: nivaranupcyclers.myshopify.com

Name: VITE_SHOPIFY_STOREFRONT_TOKEN
Value: <YOUR_STOREFRONT_TOKEN>

Name: VITE_SHOPIFY_API_VERSION
Value: 2024-01

Name: VITE_GOOGLE_CLIENT_ID
Value: <YOUR_GOOGLE_CLIENT_ID>

Name: VITE_API_URL
Value: https://your-backend-url.onrender.com
(We'll update this after deploying backend)
```

5. Click **Save** after each variable

**Option B: Via CLI**
```bash
vercel env add VITE_SHOPIFY_STORE_URL
# Enter: nivaranupcyclers.myshopify.com
# Select: Production

vercel env add VITE_SHOPIFY_STOREFRONT_TOKEN
# Enter: <YOUR_STOREFRONT_TOKEN>
# Select: Production

vercel env add VITE_SHOPIFY_API_VERSION
# Enter: 2024-01
# Select: Production

vercel env add VITE_GOOGLE_CLIENT_ID
# Enter: <YOUR_GOOGLE_CLIENT_ID>
# Select: Production
```

### Step 6: Redeploy with Environment Variables
```bash
vercel --prod
```

---

## Part 2: Deploy Backend to Render (10 minutes)

### Step 1: Create Render Account
1. Go to https://render.com
2. Click **Get Started** or **Sign Up**
3. Sign up with GitHub (recommended)
4. Authorize Render to access your GitHub

### Step 2: Create New Web Service
1. Click **New +** → **Web Service**
2. Click **Connect account** if needed
3. Find and select: **IamSagAr28/Niraran-4.1**
4. Click **Connect**

### Step 3: Configure Web Service

**Basic Settings:**
- **Name:** `nivaran-backend`
- **Region:** Choose closest to you (Singapore for India)
- **Branch:** `main`
- **Root Directory:** `server`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- Select **Free** (0$/month)

### Step 4: Add Environment Variables

Scroll down to **Environment Variables** section and add:

```
Key: PORT
Value: 5000

Key: NODE_ENV
Value: production

Key: SESSION_KEY
Value: [REDACTED]

Key: GOOGLE_CLIENT_ID
Value: [REDACTED]

Key: GOOGLE_CLIENT_SECRET
Value: [REDACTED]

Key: SHOPIFY_STORE
Value: nivaranupcyclers.myshopify.com

Key: SHOPIFY_ADMIN_TOKEN
Value: [REDACTED]

Key: FRONTEND_URL
Value: https://nivaran-4-1.vercel.app
(Use your actual Vercel URL from Part 1)

Key: GOOGLE_REDIRECT_URI
Value: https://your-backend-url.onrender.com/api/auth/google/callback
(We'll update this after deployment)
```

### Step 5: Create Web Service
1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Watch the logs for any errors

### Step 6: Get Your Render URL
After deployment, you'll see:
```
✅ Live at: https://nivaran-backend.onrender.com
```
**COPY THIS URL!**

---

## Part 3: Connect Frontend & Backend (5 minutes)

### Step 1: Update Vercel Environment Variable
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `VITE_API_URL`
3. Update value to: `https://nivaran-backend.onrender.com` (your Render URL)
4. Click **Save**
5. Go to **Deployments** → Click **...** on latest → **Redeploy**

### Step 2: Update Render Environment Variable
1. Go to Render Dashboard → Your Service → Environment
2. Find `GOOGLE_REDIRECT_URI`
3. Update value to: `https://nivaran-backend.onrender.com/api/auth/google/callback`
4. Click **Save Changes**
5. Service will auto-redeploy

### Step 3: Update Google OAuth
1. Go to https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Under **Authorized JavaScript origins**, add:
   - `https://nivaran-4-1.vercel.app` (your Vercel URL)
   - `https://nivaran-backend.onrender.com` (your Render URL)
4. Under **Authorized redirect URIs**, add:
   - `https://nivaran-backend.onrender.com/api/auth/google/callback`
5. Click **Save**

---

## Part 4: Test Your Deployment (5 minutes)

### Visit Your Live Site
Open: `https://nivaran-4-1.vercel.app` (your Vercel URL)

### Test Checklist:
- [ ] Homepage loads
- [ ] Products display from Shopify
- [ ] Categories work
- [ ] Search works
- [ ] Can add to cart
- [ ] Can register new account
- [ ] Can login with email/password
- [ ] Can login with Google
- [ ] Dashboard accessible
- [ ] Profile updates work
- [ ] Logout works

---

## Troubleshooting

### Frontend Issues:
```bash
# Check Vercel logs
vercel logs

# Redeploy
vercel --prod
```

### Backend Issues:
1. Go to Render Dashboard → Your Service
2. Click **Logs** tab
3. Look for errors
4. Check environment variables are correct

### Common Issues:

**1. CORS Errors:**
- Make sure `FRONTEND_URL` in Render matches your Vercel URL exactly
- Check `server/server.js` has correct CORS settings

**2. Google OAuth not working:**
- Verify redirect URIs in Google Console match exactly
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

**3. Shopify products not loading:**
- Verify `VITE_SHOPIFY_STORE_URL` and `VITE_SHOPIFY_STOREFRONT_TOKEN`
- Check Shopify API is enabled

---

## Quick Commands Reference

### Vercel:
```bash
vercel                    # Deploy to preview
vercel --prod            # Deploy to production
vercel logs              # View logs
vercel env ls            # List environment variables
vercel domains           # Manage custom domains
```

### Render:
- All management through web dashboard
- Logs available in real-time
- Auto-deploys on git push

---

## Your URLs (Update these with actual values):

**Frontend:** https://nivaran-4-1.vercel.app
**Backend:** https://nivaran-backend.onrender.com
**GitHub:** https://github.com/IamSagAr28/Niraran-4.1

---

## Next Steps After Deployment:

1. **Custom Domain (Optional):**
   - Vercel: Settings → Domains → Add
   - Render: Settings → Custom Domain

2. **SSL Certificate:**
   - Both platforms provide free SSL automatically ✅

3. **Monitoring:**
   - Vercel: Built-in analytics
   - Render: Built-in monitoring

4. **Database Backup:**
   - Download `server/database.sqlite` regularly
   - Consider upgrading to PostgreSQL for production

---

**Status:** Ready to deploy! Follow the steps above. 🚀

**Estimated Time:** 25-30 minutes total
