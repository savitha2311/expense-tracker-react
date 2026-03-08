# AI-Powered Expense Tracker with Analytics

## 🌐 Live Demo

- **Frontend:** https://superlative-tanuki-0c32f4.netlify.app
- **Backend API:** https://expense-tracker-backend-q1ne.onrender.com

**Note:** First load may take 30-60 seconds as the free backend wakes up.

---

A full-stack expense tracking application with an integrated AI chatbot that manages finances through natural language conversation. The chatbot performs CRUD operations, analyzes spending patterns, and provides personalized financial insights.

## 🎯 Key Features

1. **Core Expense Tracker**
   - User authentication (signup/login with JWT)
   - Dashboard with expense overview
   - Add/Edit/Delete expenses
   - Secure password handling (bcrypt)

2. **Categories & Filtering**
   - 9 pre-defined categories
   - Filter by category, date range, merchant
   - Search functionality
   - Sort by date, amount, category

3. **Analytics Dashboard**
   - Pie chart for category breakdown
   - Bar chart for spending trends
   - Budget progress indicators
   - Month-over-month comparisons
   - Top merchants analysis

4. **AI Chatbot - CREATE**
   - Add single expense: "I spent $45 on groceries at Whole Foods yesterday"
   - Add multiple expenses: "Add coffee $5.50, lunch $18, and uber $12"
   - Smart categorization from keywords
   - Date parsing (today, yesterday, last week)
   - Merchant extraction
   - Voice input support

5. **AI Chatbot - READ**
   - Query spending: "How much did I spend on food this month?"
   - Show biggest expenses: "Show me my biggest expenses from last week"
   - Compare periods: "Compare my spending this month vs last month"
   - Category breakdown with details

6. **AI Chatbot - UPDATE**
   - Update category: "Change the category of my last expense to transport"
   - Update amount: "Update yesterday's grocery expense to $52"
   - Context-aware updates: "Actually, make that $50"

7. **AI Chatbot - DELETE**
   - Delete last expense: "Delete that last expense"

8. **Context Awareness**
   - Maintains conversation context per user
   - Remembers last operations
   - Supports follow-up commands

9. **Bonus Features**
   - Export to CSV
   - Polished UI design
   - Mobile responsive
   - Voice input for chatbot

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18
- React Router (navigation)
- Axios (API calls)
- Chart.js (visualizations)

**Backend:**
- Node.js + Express
- MySQL/PostgreSQL (database)
- JWT (authentication)
- bcrypt (password hashing)

**AI/NLP:**
- Custom rule-based NLP engine
- Optional OpenAI GPT-3.5 integration
- Pattern matching & entity extraction
- Context management

### Project Structure

```
expense-tracker-react/
├── backend/
│   ├── server.js          # Express server & API routes
│   ├── chatbot.js         # Rule-based NLP engine
│   ├── db.js              # MySQL connection
│   ├── .env               # Environment variables
│   └── package.json
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Chatbot.js      # AI chatbot UI
│       │   └── Chatbot.css
│       ├── pages/
│       │   ├── Login.js        # Auth page
│       │   ├── Dashboard.js    # Main dashboard
│       │   └── Dashboard.css
│       ├── services/
│       │   └── api.js          # API service layer
│       └── App.js
└── README.md
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v14+)
- MySQL (XAMPP, MAMP, or standalone)

### 1. Clone Repository
```bash
git clone https://github.com/savitha2311/expense-tracker-react.git
cd expense-tracker-react
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=expense_tracker_react
JWT_SECRET=your_jwt_secret_key_here
OPENAI_API_KEY=your_openai_api_key_here  # Optional
```

Start backend:
```bash
node server.js
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Database
Database and tables are **automatically created** on first backend start. No manual SQL execution needed!

## 🤖 AI Integration

### How the Chatbot Works

The chatbot uses a **custom NLP engine** with optional OpenAI enhancement:

**1. Intent Recognition**
```javascript
if (message.includes('spent') || message.includes('add')) → CREATE
if (message.includes('how much') || message.includes('total')) → READ
if (message.includes('change') || message.includes('update')) → UPDATE
if (message.includes('delete') || message.includes('remove')) → DELETE
```

**2. Entity Extraction**
- **Amount:** Regex `/\$?(\d+\.?\d*)/g`
- **Date:** Natural language parsing (today, yesterday, last week)
- **Category:** Keyword matching (grocery→Groceries, uber→Transport)
- **Merchant:** Pattern matching `/at ([A-Za-z\s]+)/`

**3. Context Management**
```javascript
context: { lastExpense: { id, amount, category } }
```
Enables follow-up commands like "Actually, make that $50"

**4. Database Operations**
All chatbot commands execute actual SQL queries:
- CREATE → INSERT INTO expenses
- READ → SELECT with filters
- UPDATE → UPDATE expenses SET
- DELETE → DELETE FROM expenses

### Chatbot Examples

**CREATE:**
```
User: "I spent $45 on groceries at Whole Foods yesterday"
Bot: "Added $45 for Groceries at Whole Foods on 2024-03-09"

User: "Add coffee $5.50, lunch $18, and uber $12 from today"
Bot: "Added 3 expenses totaling $35.50 for today"
```

**READ:**
```
User: "How much did I spend on food this month?"
Bot: "You spent $342 on food this month: $180 on Groceries, $120 on Food, $42 on Coffee"

User: "Show me my biggest expenses from last week"
Bot: "Your biggest expenses: 1. Rent $1,200, 2. Groceries $85, 3. Gas $60"
```

**UPDATE:**
```
User: "Change the category of my last expense to transport"
Bot: "Updated category to Transport"

User: "Actually, make that $50"
Bot: "Updated amount to $50"
```

**DELETE:**
```
User: "Delete that last expense"
Bot: "Deleted $12 Uber expense"
```

**INSIGHTS:**
```
User: "Give me insights on my spending"
Bot: "Your top spending category is Food at $342 (45% of total). Consider setting a budget."

User: "Am I on track with my budget?"
Bot: "Food: ⚠️ Over ($520/$500 - 104%), Transport: ✅ Good ($180/$300 - 60%)"
```

## 🎨 UI Features

- **Dashboard:** Overview cards, charts, recent transactions
- **Transaction History:** Filterable, searchable, sortable list
- **Budgets:** Visual progress bars with alerts
- **Analytics:** Multiple chart types, comparisons
- **Chatbot:** Floating chat interface with voice input
- **Responsive Design:** Works on desktop and mobile

## 🔒 Security

- JWT token authentication
- Password hashing with bcrypt (10 rounds)
- SQL injection prevention (parameterized queries)
- CORS configuration
- Protected API routes

## 🔑 Environment Variables

### Required Variables

**Backend (.env):**
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database (Local Development - MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=expense_tracker_react
DB_PORT=3306

# Database (Production - PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# AI Integration (Optional)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

## 🧪 Testing

### Manual Test Scenarios

1. **Authentication:**
   - Signup with new user
   - Login with credentials
   - Protected routes

2. **Expense Management:**
   - Add via form
   - Add via chatbot
   - Edit expense
   - Delete expense

3. **Chatbot CRUD:**
   - All CREATE examples
   - All READ examples
   - All UPDATE examples
   - All DELETE examples

4. **Analytics:**
   - View charts
   - Filter data
   - Export CSV
   - Budget tracking

---

**Developed by Saveetha**
