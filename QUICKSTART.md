# Quick Start Guide

## Prerequisites
- XAMPP installed (for MySQL)
- Node.js installed

## Setup Steps

### 1. Start MySQL
- Open XAMPP Control Panel
- Start Apache and MySQL

### 2. Backend Setup
```bash
cd c:\xampp\htdocs\expense-tracker-react\backend
npm install
node server.js
```

You should see:
```
Database initialized successfully
Server running on port 5000
AI Chatbot ready!
```

### 3. Frontend Setup
Open a new terminal:
```bash
cd c:\xampp\htdocs\expense-tracker-react\frontend
npm install
npm start
```

Browser will open at `http://localhost:3000`

## First Time Use

1. **Create Account**
   - Click "Sign Up" tab
   - Fill in: Full Name, Email, Username, Password
   - Click "Create Account"

2. **Login**
   - Enter Username and Password
   - Click "Login"

3. **Use the Dashboard**
   - View your expense statistics
   - Add expenses using the "+ Add Expense" button
   - View transaction history

4. **Use AI Chatbot**
   - Click the chat icon (💬) in bottom-right corner
   - Try these commands:
     - "I spent $45 on groceries at Whole Foods"
     - "How much did I spend this month?"
     - "Show my biggest expenses"
     - "Give me insights"

## Quick Test Commands

### Add Expenses
```
I spent $45 on groceries yesterday
Add coffee $5.50, lunch $18, and uber $12 from today
Paid electricity bill $89
```

### Query Expenses
```
How much did I spend on food this month?
Show me my biggest expenses from last week
Compare my spending this month vs last month
```

### Update/Delete
```
Change the category of my last expense to transport
Delete that last expense
```

### Get Insights
```
Give me insights on my spending
Am I on track with my budget?
```

## Troubleshooting

### Database Error
If you see "Table doesn't exist":
- Make sure MySQL is running in XAMPP
- Restart the backend server (it will auto-create tables)

### Port Already in Use
If port 5000 is busy:
- Change PORT in `.env` file
- Update API_URL in `frontend/src/services/api.js`

### Frontend Won't Start
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

## Project Structure
```
expense-tracker-react/
├── backend/
│   ├── server.js          # Main server
│   ├── chatbot.js         # AI chatbot logic
│   ├── db.js              # Database connection
│   └── .env               # Environment variables
└── frontend/
    └── src/
        ├── components/
        │   └── Chatbot.js # Chatbot UI
        ├── pages/
        │   ├── Login.js   # Auth page
        │   └── Dashboard.js # Main dashboard
        └── services/
            └── api.js     # API calls
```

## Features Checklist

- [x] User Authentication
- [x] Dashboard with Statistics
- [x] Add/Edit/Delete Expenses
- [x] Category Breakdown Chart
- [x] Transaction History
- [x] AI Chatbot Integration
- [x] Natural Language Processing
- [x] CRUD via Chat
- [x] Smart Categorization
- [x] Context Awareness
- [x] Spending Insights
- [x] Budget Tracking

## Next Steps

1. Set budgets for categories
2. Add more expenses via chat
3. Explore analytics and insights
4. Test different natural language commands

Enjoy your AI-powered expense tracker! 🚀
