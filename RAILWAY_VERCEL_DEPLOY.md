# Railway Deployment - Step by Step

## 🚂 Deploy Backend to Railway (5 minutes)

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click "Login" → "Login with GitHub"
3. Authorize Railway

### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. If first time: Click "Configure GitHub App"
4. Select your repository: `expense-tracker-react`
5. Click "Deploy Now"

### Step 3: Add MySQL Database
1. In your project, click "+ New"
2. Select "Database"
3. Choose "Add MySQL"
4. Railway creates MySQL instance automatically

### Step 4: Configure Backend Service
1. Click on your backend service (the one from GitHub)
2. Go to "Settings" tab
3. Set "Root Directory" to `backend`
4. Set "Start Command" to `node server.js`

### Step 5: Add Environment Variables
1. Click "Variables" tab
2. Click "Raw Editor"
3. Paste this (Railway auto-fills MySQL vars):

```env
DB_HOST=${{MySQL.MYSQLHOST}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
DB_NAME=expense_tracker_react
DB_PORT=${{MySQL.MYSQLPORT}}
JWT_SECRET=your_super_secret_jwt_key_change_this
OPENAI_API_KEY=your_openai_api_key_here
PORT=5000
```

4. Click "Update Variables"

### Step 6: Get Backend URL
1. Go to "Settings" tab
2. Scroll to "Domains"
3. Click "Generate Domain"
4. Copy URL: `https://your-app.up.railway.app`

### Step 7: Update CORS (Important!)
Railway will give you a URL. You need to allow it in your backend.

The backend already has `app.use(cors())` which allows all origins. For production, you can restrict it later.

---

## 🎨 Deploy Frontend to Vercel (3 minutes)

### Step 1: Update API URL
1. Open `frontend/src/services/api.js`
2. Change line 3:
```javascript
const API_URL = 'https://your-app.up.railway.app/api';
```
Replace with your Railway backend URL

3. Commit and push changes:
```bash
git add .
git commit -m "Update API URL for production"
git push
```

### Step 2: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up" → "Continue with GitHub"
3. Authorize Vercel

### Step 3: Import Project
1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Click "Import"

### Step 4: Configure Project
1. **Framework Preset:** Create React App (auto-detected)
2. **Root Directory:** Click "Edit" → Select `frontend`
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `build` (default)
5. **Install Command:** `npm install` (default)

### Step 5: Deploy
1. Click "Deploy"
2. Wait 2-3 minutes
3. Get your URL: `https://your-app.vercel.app`

---

## ✅ Verify Deployment

### Test Backend
```bash
# Test if backend is running
curl https://your-app.up.railway.app/api/stats

# Should return: {"error":"Access denied"} (because no auth token)
# This means backend is working!
```

### Test Frontend
1. Open `https://your-app.vercel.app`
2. Click "Sign Up"
3. Create account
4. Login
5. Try chatbot: "I spent $50 on groceries"
6. Check if expense appears

---

## 🔧 If Something Goes Wrong

### Backend Not Starting
1. Check Railway logs:
   - Click on backend service
   - Go to "Deployments" tab
   - Click latest deployment
   - Check logs

2. Common issues:
   - Missing environment variables
   - Database not connected
   - Wrong start command

### Frontend Can't Connect to Backend
1. Check API URL in `frontend/src/services/api.js`
2. Check browser console for errors
3. Verify backend URL is correct
4. Test backend URL directly in browser

### Database Connection Error
1. Go to Railway MySQL service
2. Copy connection details
3. Update backend environment variables
4. Redeploy backend

---

## 📱 Quick Commands

### Redeploy Backend (Railway)
```bash
# Just push to GitHub
git add .
git commit -m "Update"
git push

# Railway auto-deploys
```

### Redeploy Frontend (Vercel)
```bash
# Just push to GitHub
git add .
git commit -m "Update"
git push

# Vercel auto-deploys
```

---

## 🎯 Final URLs for Submission

After deployment, you'll have:

1. **Frontend:** `https://your-app.vercel.app`
2. **Backend:** `https://your-app.up.railway.app`

Update your README.md with these URLs!

---

## 💡 Pro Tips

1. **Custom Domain (Optional):**
   - Vercel: Settings → Domains → Add
   - Railway: Settings → Domains → Custom Domain

2. **Environment Variables:**
   - Never commit `.env` files
   - Use Railway/Vercel dashboard to set them

3. **Monitoring:**
   - Railway: Check logs in dashboard
   - Vercel: Check logs in dashboard

4. **Free Tier Limits:**
   - Railway: $5 credit/month (enough for demo)
   - Vercel: Unlimited for personal projects

---

## 🚀 You're Done!

Your app is now live and accessible worldwide! 🎉

**Next Steps:**
1. Test all features
2. Update README with live URLs
3. Submit to Nebula KnowLab
4. Celebrate! 🎊
