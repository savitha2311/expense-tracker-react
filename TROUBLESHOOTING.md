# 🔧 TROUBLESHOOTING GUIDE

Common issues and how to fix them!

---

## 🔴 GITHUB ISSUES

### Issue: "git: command not found"

**Solution:**
1. Install Git: https://git-scm.com/download/win
2. Restart Command Prompt
3. Try again

---

### Issue: "Permission denied (publickey)"

**Solution:**
1. Use HTTPS instead of SSH
2. URL should be: `https://github.com/...` not `git@github.com:...`
3. GitHub will ask for username/password

---

### Issue: "Repository not found"

**Solution:**
1. Check repository name is correct
2. Make sure repository is created on GitHub
3. Verify you're logged into correct GitHub account

---

## 🔵 RENDER DATABASE ISSUES

### Issue: "Database creation failed"

**Solution:**
1. Refresh the page
2. Try again
3. Make sure you selected FREE plan
4. Check your email for verification

---

### Issue: "Can't find Internal Database URL"

**Solution:**
1. Click on your database service
2. Look for "Internal Database URL" section
3. It's usually near the top
4. Click the copy icon next to it

---

### Issue: "Database URL not working"

**Solution:**
1. Make sure you copied the INTERNAL URL, not External
2. URL should start with: `postgresql://`
3. Don't add quotes around it
4. Copy the entire URL (it's long!)

---

## 🟢 RENDER BACKEND ISSUES

### Issue: "Build failed"

**Possible Causes & Solutions:**

**1. Wrong Root Directory**
- Go to Settings
- Set Root Directory to: `backend`
- Redeploy

**2. Wrong Start Command**
- Go to Settings
- Set Start Command to: `node server-postgres.js`
- NOT `node server.js`!
- Redeploy

**3. Missing package.json**
- Check if `backend/package.json` exists
- Should be in backend folder, not root

---

### Issue: "Application failed to respond"

**Check These:**

1. **Environment Variables**
   - Go to Environment tab
   - Verify all 4 variables are set:
     - DATABASE_URL
     - JWT_SECRET
     - OPENAI_API_KEY
     - NODE_ENV
   - No typos in variable names!

2. **Database Connection**
   - Copy DATABASE_URL from database page
   - Update in backend environment variables
   - Redeploy

3. **Check Logs**
   - Go to Logs tab
   - Look for error messages
   - Common errors:
     - "Cannot connect to database" → Wrong DATABASE_URL
     - "Module not found" → Wrong root directory
     - "Port already in use" → Ignore (Render handles this)

---

### Issue: "Service keeps restarting"

**Solution:**
1. Check Logs for error message
2. Common causes:
   - Database not connected
   - Missing environment variables
   - Syntax error in code
3. Fix the error
4. Redeploy

---

### Issue: "Can't access backend URL"

**Check:**
1. Service shows "Live" with green dot
2. URL is correct (copy from Render dashboard)
3. Try: `https://your-backend.onrender.com/api/stats`
4. Should see: `{"error":"Access denied"}`
5. This is GOOD! Backend is working!

---

## 🟡 FRONTEND UPDATE ISSUES

### Issue: "Can't find api.js file"

**Solution:**
1. File is at: `frontend/src/services/api.js`
2. Not in backend folder!
3. Use file explorer to navigate
4. Open with any text editor

---

### Issue: "Git says no changes"

**Solution:**
1. Make sure you saved the file (Ctrl+S)
2. Check if you edited the right file
3. Try: `git status` to see changes
4. If no changes shown, file wasn't saved

---

### Issue: "Push rejected"

**Solution:**
1. Pull first: `git pull origin main`
2. Then push: `git push`
3. If conflicts, resolve them
4. Or force push: `git push -f` (careful!)

---

## 🟣 VERCEL ISSUES

### Issue: "Build failed"

**Possible Causes:**

**1. Wrong Root Directory**
- Click "Settings" in Vercel
- Go to "General"
- Set Root Directory to: `frontend`
- Redeploy

**2. Missing dependencies**
- Check `frontend/package.json` exists
- Should have all dependencies listed
- Vercel runs `npm install` automatically

**3. Build errors**
- Check build logs
- Look for error message
- Common: Missing files, syntax errors
- Fix in code, push to GitHub
- Vercel auto-redeploys

---

### Issue: "Deployment successful but app doesn't work"

**Check:**

1. **API URL**
   - Open browser console (F12)
   - Look for network errors
   - Check if API_URL is correct in `api.js`
   - Should be your Render URL, not localhost

2. **CORS Error**
   - Backend should have `app.use(cors())`
   - Already in your code!
   - If still error, check backend logs

3. **Backend Sleeping**
   - First request takes 30-60 seconds
   - Wait and try again
   - Subsequent requests are fast

---

### Issue: "Can't find my project"

**Solution:**
1. Go to Vercel dashboard
2. Click "View All Projects"
3. Find your project in list
4. If not there, import again from GitHub

---

## 🧪 TESTING ISSUES

### Issue: "Can't sign up"

**Possible Causes:**

**1. Backend sleeping**
- Wait 60 seconds
- Try again
- First request wakes up backend

**2. Backend not connected**
- Check API_URL in `frontend/src/services/api.js`
- Should be your Render URL
- No trailing slash!

**3. Database error**
- Check Render backend logs
- Look for database connection errors
- Verify DATABASE_URL is correct

---

### Issue: "Sign up works but login fails"

**Solution:**
1. Check browser console (F12)
2. Look for error message
3. Common: Wrong password
4. Try signing up with new account
5. Check backend logs for errors

---

### Issue: "Chatbot doesn't respond"

**Check:**

1. **Backend working?**
   - Test: `https://your-backend.onrender.com/api/stats`
   - Should return error (means it's working)

2. **Logged in?**
   - Chatbot requires authentication
   - Make sure you're logged in

3. **Backend logs**
   - Check for errors in Render logs
   - Look for chatbot-related errors

---

### Issue: "Expenses don't appear"

**Solution:**
1. Refresh the page
2. Check browser console for errors
3. Check network tab (F12) for failed requests
4. Verify backend is responding
5. Check database has data (Render dashboard)

---

## 🔄 DEPLOYMENT ISSUES

### Issue: "Changes not showing up"

**Solution:**

**For Backend (Render):**
1. Check if deployment finished
2. Go to Deployments tab
3. Should show "Live"
4. If failed, check logs
5. May need to manually deploy

**For Frontend (Vercel):**
1. Check if deployment finished
2. Go to Deployments in Vercel
3. Should show "Ready"
4. Clear browser cache (Ctrl+Shift+R)
5. Try incognito mode

---

### Issue: "Auto-deploy not working"

**Solution:**

**Render:**
1. Go to Settings
2. Check "Auto-Deploy" is enabled
3. Check branch is set to "main"
4. Try manual deploy

**Vercel:**
1. Go to Settings → Git
2. Check "Production Branch" is "main"
3. Check GitHub integration is connected
4. Try manual deploy

---

## 🌐 BROWSER ISSUES

### Issue: "Page not loading"

**Try:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Try incognito/private mode
3. Try different browser
4. Check internet connection
5. Wait 60 seconds (backend waking up)

---

### Issue: "CORS error in console"

**Solution:**
1. Backend should have `app.use(cors())`
2. Already in your code!
3. If still error:
   - Check backend is running
   - Verify API_URL is correct
   - Check backend logs

---

### Issue: "Mixed content error"

**Solution:**
1. Make sure API_URL starts with `https://`
2. Not `http://`
3. Render provides HTTPS automatically

---

## 📱 MOBILE ISSUES

### Issue: "App doesn't work on mobile"

**Check:**
1. Same URL works on desktop?
2. Mobile browser is updated
3. Try different mobile browser
4. Check responsive design (should work!)

---

## 💾 DATABASE ISSUES

### Issue: "Data not persisting"

**Solution:**
1. Check database is created on Render
2. Verify DATABASE_URL is correct
3. Check backend logs for database errors
4. Make sure tables are created (auto-created on first run)

---

### Issue: "Can't see database data"

**Solution:**
1. Render doesn't provide GUI for free tier
2. Use backend API to check data
3. Or upgrade to paid plan for GUI access
4. Data is there, just can't see it directly

---

## 🔐 SECURITY ISSUES

### Issue: "JWT token invalid"

**Solution:**
1. Clear browser localStorage
2. Log out and log in again
3. Check JWT_SECRET is set in backend
4. Make sure it's the same value always

---

### Issue: "Unauthorized errors"

**Solution:**
1. Make sure you're logged in
2. Check token is being sent
3. Open browser console → Network tab
4. Check Authorization header is present
5. If missing, clear cache and login again

---

## 🆘 STILL STUCK?

### Step-by-Step Debug Process:

**1. Check Backend**
```
Visit: https://your-backend.onrender.com/api/stats
Expected: {"error":"Access denied"}
If different: Backend has issues
```

**2. Check Frontend**
```
Open browser console (F12)
Look for red errors
Note the error message
```

**3. Check Logs**
```
Render: Dashboard → Service → Logs
Vercel: Dashboard → Project → Deployments → Logs
Look for error messages
```

**4. Check Environment Variables**
```
Render: Environment tab
Should have 4 variables
No typos in names
```

**5. Check Code**
```
frontend/src/services/api.js line 3
Should be your Render URL
Not localhost!
```

---

## 📞 Getting Help

If still stuck, gather this info:

1. **What step are you on?**
2. **What error message do you see?**
3. **What have you tried?**
4. **Screenshots of:**
   - Error message
   - Render logs
   - Browser console
   - Vercel deployment status

---

## ✅ QUICK FIXES CHECKLIST

Before asking for help, try these:

- [ ] Cleared browser cache
- [ ] Waited 60 seconds (backend wake up)
- [ ] Checked Render logs
- [ ] Verified all environment variables
- [ ] Confirmed API_URL is correct
- [ ] Tried different browser
- [ ] Checked GitHub code is pushed
- [ ] Verified deployments are "Live"/"Ready"
- [ ] Tested backend URL directly
- [ ] Checked browser console for errors

---

## 🎯 MOST COMMON ISSUES

**Top 5 Issues & Solutions:**

1. **Backend sleeping (30-60s wait)**
   → Just wait, it's normal for free tier

2. **Wrong API_URL in frontend**
   → Check `frontend/src/services/api.js` line 3

3. **Wrong start command**
   → Must be `node server-postgres.js`

4. **Wrong DATABASE_URL**
   → Copy from Render database page

5. **Wrong root directory**
   → Backend: `backend`, Frontend: `frontend`

---

**Fix these 5 and 90% of issues are solved!** ✅

---

## 🎉 WORKING NOW?

If you fixed your issue:
- [ ] Note what the problem was
- [ ] Note what fixed it
- [ ] Continue with deployment!

**You got this!** 💪
