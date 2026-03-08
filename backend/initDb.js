const mysql = require('mysql2/promise');
require('dotenv').config();

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

initDatabase().catch(console.error);
