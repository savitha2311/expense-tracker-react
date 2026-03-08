const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db-postgres');
const { processMessage } = require('./chatbot-postgres');
const { processMessageWithAI } = require('./chatbotAI');
require('dotenv').config();

const app = express();

// Initialize PostgreSQL database
async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        full_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(50) NOT NULL,
        description TEXT,
        merchant VARCHAR(100),
        payment_method VARCHAR(50),
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        period VARCHAR(20) DEFAULT 'monthly',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (user_id, category, period)
      )
    `);
    
    console.log('PostgreSQL database initialized successfully');
  } finally {
    client.release();
  }
}

app.use(cors());
app.use(express.json());

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Access denied' });
  
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = verified.id;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

// AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password, full_name) VALUES ($1, $2, $3, $4) RETURNING id',
      [username, email, hashedPassword, fullName]
    );
    
    res.json({ message: 'User created successfully', userId: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, fullName: user.full_name } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// EXPENSE ROUTES
app.get('/api/expenses', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM expenses WHERE user_id = $1 ORDER BY expense_date DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/expenses', auth, async (req, res) => {
  try {
    const { amount, category, description, merchant, paymentMethod, expenseDate } = req.body;
    const result = await pool.query(
      'INSERT INTO expenses (user_id, amount, category, description, merchant, payment_method, expense_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [req.userId, amount, category, description, merchant, paymentMethod, expenseDate]
    );
    res.json({ message: 'Expense added', id: result.rows[0].id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', auth, async (req, res) => {
  try {
    const { amount, category, description, merchant, paymentMethod, expenseDate } = req.body;
    await pool.query(
      'UPDATE expenses SET amount = $1, category = $2, description = $3, merchant = $4, payment_method = $5, expense_date = $6 WHERE id = $7 AND user_id = $8',
      [amount, category, description, merchant, paymentMethod, expenseDate, req.params.id, req.userId]
    );
    res.json({ message: 'Expense updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [req.params.id, req.userId]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// STATISTICS
app.get('/api/stats', auth, async (req, res) => {
  try {
    const total = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = $1', [req.userId]);
    const monthly = await pool.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE)', [req.userId]);
    const categories = await pool.query('SELECT category, SUM(amount) as total FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE) GROUP BY category', [req.userId]);
    
    res.json({
      totalExpenses: total.rows[0].total || 0,
      monthlyExpenses: monthly.rows[0].total || 0,
      categoryBreakdown: categories.rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// BUDGETS
app.get('/api/budgets', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT b.*, COALESCE(SUM(e.amount), 0) as spent 
       FROM budgets b 
       LEFT JOIN expenses e ON b.category = e.category AND e.user_id = b.user_id AND EXTRACT(MONTH FROM e.expense_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       WHERE b.user_id = $1 
       GROUP BY b.id`,
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/budgets', auth, async (req, res) => {
  try {
    const { category, amount } = req.body;
    await pool.query(
      'INSERT INTO budgets (user_id, category, amount) VALUES ($1, $2, $3) ON CONFLICT (user_id, category, period) DO UPDATE SET amount = $3',
      [req.userId, category, amount]
    );
    res.json({ message: 'Budget set' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// CHATBOT
let userContexts = {};

app.post('/api/chat', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const context = userContexts[req.userId] || {};
    
    const useAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    
    const result = useAI 
      ? await processMessageWithAI(message, req.userId, context)
      : await processMessage(message, req.userId, context);
    
    if (result.context) {
      userContexts[req.userId] = { ...context, ...result.context };
    }
    
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      const aiMode = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here' ? 'OpenAI GPT' : 'Rule-Based';
      console.log(`Server running on port ${PORT}`);
      console.log(`AI Chatbot ready! (Mode: ${aiMode})`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
