# Deployment Guide - Vercel + Railway

## 🚀 Recommended Deployment Strategy

**Frontend:** Vercel (Free, Fast, Easy)
**Backend:** Railway (Free tier, MySQL included)

---

## Option 1: Frontend on Vercel + Backend on Railway (RECOMMENDED)

### Step 1: Deploy Backend to Railway

1. **Go to Railway.app**
   - Visit https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your repository

3. **Add MySQL Database**
   - Click "+ New"
   - Select "Database" → "MySQL"
   - Railway will create a MySQL instance

4. **Configure Backend Service**
   - Click on your backend service
   - Go to "Variables" tab
   - Add environment variables:
     ```
     DB_HOST=<from MySQL service>
     DB_USER=<from MySQL service>
     DB_PASSWORD=<from MySQL service>
     DB_NAME=expense_tracker_react
     JWT_SECRET=your_strong_secret_key_here
     OPENAI_API_KEY=your_openai_key_or_leave_empty
     PORT=5000
     ```
   - Railway auto-fills MySQL credentials

5. **Deploy**
   - Railway auto-deploys on push
   - Get your backend URL: `https://your-app.railway.app`

### Step 2: Deploy Frontend to Vercel

1. **Update API URL**
   - Open `frontend/src/services/api.js`
   - Change:
     ```javascript
     const API_URL = 'https://your-backend.railway.app/api';
     ```

2. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up with GitHub

3. **Import Project**
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select `frontend` folder as root directory

4. **Configure Build Settings**
   - Framework Preset: Create React App
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

5. **Deploy**
   - Click "Deploy"
   - Get your frontend URL: `https://your-app.vercel.app`

---

## Option 2: Full-Stack on Railway (Alternative)

### Deploy Everything on Railway

1. **Create Railway Project**
   - New Project → Deploy from GitHub

2. **Add MySQL Database**
   - Add MySQL service to project

3. **Configure Environment Variables**
   - Same as above

4. **Deploy Backend**
   - Railway detects Node.js
   - Auto-deploys backend

5. **Deploy Frontend**
   - Add new service from same repo
   - Set root directory to `frontend`
   - Add build command: `npm run build && npm install -g serve && serve -s build`

---

## Option 3: Vercel Serverless (Advanced)

If you want everything on Vercel, convert backend to serverless functions:

### Backend as Vercel Serverless Functions

1. **Create `api` folder in root**
2. **Convert routes to serverless functions**
3. **Use Vercel Postgres or external MySQL**

**Note:** This requires significant refactoring. Not recommended for this project.

---

## 🎯 Quick Deploy Commands

### Railway Backend

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Deploy
railway up
```

### Vercel Frontend

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] Environment variables configured
- [ ] MySQL database created
- [ ] CORS allows frontend domain
- [ ] JWT secret is strong
- [ ] Database auto-initializes

### Frontend
- [ ] API URL updated to production backend
- [ ] Build succeeds locally (`npm run build`)
- [ ] No console errors
- [ ] All features tested

---

## 🔧 Configuration Files

### Frontend `.env` (if needed)
```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

### Update `frontend/src/services/api.js`
```javascript
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend.railway.app/api';
```

---

## 🌐 After Deployment

### Test Your Deployment

1. **Frontend URL:** `https://your-app.vercel.app`
2. **Backend URL:** `https://your-backend.railway.app`

### Test Checklist
- [ ] Can access frontend
- [ ] Can signup new user
- [ ] Can login
- [ ] Can add expense via form
- [ ] Can add expense via chatbot
- [ ] Chatbot responds correctly
- [ ] Dashboard shows data
- [ ] Charts render
- [ ] CSV export works

---

## 🐛 Troubleshooting

### CORS Error
Add frontend URL to backend CORS:
```javascript
app.use(cors({
  origin: 'https://your-app.vercel.app'
}));
```

### Database Connection Error
- Check Railway MySQL credentials
- Ensure DB_HOST, DB_USER, DB_PASSWORD are correct
- Check if database is running

### Build Fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### API Not Found
- Verify backend URL in frontend
- Check backend is deployed and running
- Test backend endpoint: `https://your-backend.railway.app/api/stats`

---

## 💰 Cost Estimate

### Railway (Backend + MySQL)
- **Free Tier:** $5 credit/month
- **Enough for:** Development and demo
- **Upgrade:** $5/month for more resources

### Vercel (Frontend)
- **Free Tier:** Unlimited
- **Perfect for:** Static React apps

**Total Cost:** $0 for demo/evaluation

---

## 📝 Submission URLs

After deployment, update your README with:

```markdown
## 🌐 Live Demo

**Frontend:** https://your-app.vercel.app
**Backend API:** https://your-backend.railway.app

## 🔗 Repository

**GitHub:** https://github.com/yourusername/expense-tracker-react
```

---

## 🚀 Alternative Platforms

If Railway/Vercel don't work:

### Backend Alternatives
1. **Render** - https://render.com (Free tier)
2. **Heroku** - https://heroku.com ($5/month)
3. **DigitalOcean** - https://digitalocean.com ($5/month)

### Frontend Alternatives
1. **Netlify** - https://netlify.com (Free)
2. **GitHub Pages** - Free (static only)
3. **Cloudflare Pages** - Free

### Database Alternatives
1. **PlanetScale** - Free MySQL
2. **Supabase** - Free PostgreSQL
3. **MongoDB Atlas** - Free NoSQL

---

## ✅ Final Steps

1. Deploy backend to Railway
2. Get backend URL
3. Update frontend API URL
4. Deploy frontend to Vercel
5. Test all features
6. Update README with live URLs
7. Submit to Nebula KnowLab

**You're ready to deploy! 🎉**
