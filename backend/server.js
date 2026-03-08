const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');
const mysql = require('mysql2/promise');
const { processMessage } = require('./chatbot');
const { processMessageWithAI } = require('./chatbotAI');
require('dotenv').config();

const app = express();
// Initialize database
async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
  await connection.query(`USE ${process.env.DB_NAME}`);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INT PRIMARY KEY AUTO_INCREMENT,
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
  await connection.query(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      period VARCHAR(20) DEFAULT 'monthly',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_budget (user_id, category, period)
    )
  `);
  await connection.end();
  console.log('Database initialized successfully');
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
    
    const [result] = await db.query(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, fullName]
    );
    
    res.json({ message: 'User created successfully', userId: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
    
    const user = users[0];
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
    const [expenses] = await db.query(
      'SELECT * FROM expenses WHERE user_id = ? ORDER BY expense_date DESC',
      [req.userId]
    );
    res.json(expenses);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/expenses', auth, async (req, res) => {
  try {
    const { amount, category, description, merchant, paymentMethod, expenseDate } = req.body;
    const [result] = await db.query(
      'INSERT INTO expenses (user_id, amount, category, description, merchant, payment_method, expense_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.userId, amount, category, description, merchant, paymentMethod, expenseDate]
    );
    res.json({ message: 'Expense added', id: result.insertId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', auth, async (req, res) => {
  try {
    const { amount, category, description, merchant, paymentMethod, expenseDate } = req.body;
    await db.query(
      'UPDATE expenses SET amount = ?, category = ?, description = ?, merchant = ?, payment_method = ?, expense_date = ? WHERE id = ? AND user_id = ?',
      [amount, category, description, merchant, paymentMethod, expenseDate, req.params.id, req.userId]
    );
    res.json({ message: 'Expense updated' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
  try {
    await db.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// STATISTICS
app.get('/api/stats', auth, async (req, res) => {
  try {
    const [total] = await db.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [req.userId]);
    const [monthly] = await db.query('SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE())', [req.userId]);
    const [categories] = await db.query('SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) GROUP BY category', [req.userId]);
    
    res.json({
      totalExpenses: total[0].total || 0,
      monthlyExpenses: monthly[0].total || 0,
      categoryBreakdown: categories
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// BUDGETS
app.get('/api/budgets', auth, async (req, res) => {
  try {
    const [budgets] = await db.query(
      `SELECT b.*, COALESCE(SUM(e.amount), 0) as spent 
       FROM budgets b 
       LEFT JOIN expenses e ON b.category = e.category AND e.user_id = b.user_id AND MONTH(e.expense_date) = MONTH(CURDATE()) 
       WHERE b.user_id = ? 
       GROUP BY b.id`,
      [req.userId]
    );
    res.json(budgets);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/budgets', auth, async (req, res) => {
  try {
    const { category, amount } = req.body;
    await db.query(
      'INSERT INTO budgets (user_id, category, amount) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE amount = ?',
      [req.userId, category, amount, amount]
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
    
    // Use OpenAI if API key is configured, otherwise use rule-based
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