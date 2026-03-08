const pool = require('./db-postgres');

const categories = ['Food', 'Groceries', 'Transport', 'Coffee', 'Bills', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];

function parseDate(dateStr) {
  const today = new Date();
  const lower = dateStr.toLowerCase();
  
  if (lower.includes('today')) return today.toISOString().split('T')[0];
  if (lower.includes('yesterday')) {
    today.setDate(today.getDate() - 1);
    return today.toISOString().split('T')[0];
  }
  if (lower.includes('last week')) {
    today.setDate(today.getDate() - 7);
    return today.toISOString().split('T')[0];
  }
  return today.toISOString().split('T')[0];
}

function categorizeExpense(text) {
  const lower = text.toLowerCase();
  if (lower.includes('grocery') || lower.includes('groceries') || lower.includes('whole foods') || lower.includes('supermarket')) return 'Groceries';
  if (lower.includes('coffee') || lower.includes('starbucks') || lower.includes('cafe')) return 'Coffee';
  if (lower.includes('uber') || lower.includes('taxi') || lower.includes('bus') || lower.includes('gas') || lower.includes('fuel')) return 'Transport';
  if (lower.includes('restaurant') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('breakfast') || lower.includes('food')) return 'Food';
  if (lower.includes('bill') || lower.includes('electricity') || lower.includes('water') || lower.includes('rent') || lower.includes('utility')) return 'Bills';
  if (lower.includes('movie') || lower.includes('entertainment') || lower.includes('game')) return 'Entertainment';
  if (lower.includes('shopping') || lower.includes('clothes') || lower.includes('amazon')) return 'Shopping';
  if (lower.includes('doctor') || lower.includes('medicine') || lower.includes('hospital') || lower.includes('healthcare')) return 'Healthcare';
  return 'Other';
}

function extractExpenses(text) {
  const expenses = [];
  const parts = text.split(/,| and /);
  parts.forEach((part) => {
    const match = part.match(/\$?(\d+\.?\d*)/);
    if (match) {
      const amount = parseFloat(match[1]);
      const merchant = part.match(/at ([A-Za-z\s]+)/)?.[1]?.trim() || '';
      expenses.push({
        amount,
        category: categorizeExpense(part),
        description: part.trim(),
        merchant,
        date: parseDate(text)
      });
    }
  });
  
  return expenses;
}

async function processMessage(message, userId, context = {}) {
  const lower = message.toLowerCase();
  
  // CREATE - Add expenses
  if (lower.includes('spent') || lower.includes('add') || lower.includes('paid')) {
    const expenses = extractExpenses(message);
    if (expenses.length === 0) return { response: "I couldn't extract expense details. Please specify amount and description." };
    
    const results = [];
    for (const exp of expenses) {
      const result = await pool.query(
        'INSERT INTO expenses (user_id, amount, category, description, merchant, expense_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [userId, exp.amount, exp.category, exp.description, exp.merchant, exp.date]
      );
      results.push({ id: result.rows[0].id, ...exp });
    }
    
    if (expenses.length === 1) {
      const exp = expenses[0];
      return {
        response: `Added $${exp.amount} for ${exp.category}${exp.merchant ? ' at ' + exp.merchant : ''} on ${exp.date}`,
        data: results,
        context: { lastExpense: results[0] }
      };
    } else {
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      return {
        response: `Added ${expenses.length} expenses totaling $${total.toFixed(2)} for today`,
        data: results,
        context: { lastExpenses: results }
      };
    }
  }
  
  // READ - Query expenses
  if (lower.includes('how much') || lower.includes('spent on') || lower.includes('total')) {
    let query = 'SELECT * FROM expenses WHERE user_id = $1';
    const params = [userId];
    let paramCount = 1;
    
    if (lower.includes('this month')) {
      query += ' AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM CURRENT_DATE)';
    } else if (lower.includes('last month')) {
      query += ' AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL \'1 month\') AND EXTRACT(YEAR FROM expense_date) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL \'1 month\')';
    } else if (lower.includes('last week') || lower.includes('past week')) {
      query += ' AND expense_date >= CURRENT_DATE - INTERVAL \'7 days\'';
    } else if (lower.includes('today')) {
      query += ' AND expense_date = CURRENT_DATE';
    }
    
    const category = categories.find(c => lower.includes(c.toLowerCase()));
    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }
    
    const result = await pool.query(query, params);
    const expenses = result.rows;
    const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    
    if (expenses.length === 0) return { response: "No expenses found for that period." };
    
    const breakdown = {};
    expenses.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + parseFloat(e.amount);
    });
    
    let response = `You spent $${total.toFixed(2)}`;
    if (category) response += ` on ${category}`;
    if (lower.includes('this month')) response += ' this month';
    else if (lower.includes('last week')) response += ' last week';
    
    if (Object.keys(breakdown).length > 1) {
      response += ': ' + Object.entries(breakdown).map(([cat, amt]) => `$${amt.toFixed(2)} on ${cat}`).join(', ');
    }
    
    return { response, data: expenses };
  }
  
  // READ - Show biggest expenses
  if (lower.includes('biggest') || lower.includes('largest') || lower.includes('top')) {
    let query = 'SELECT * FROM expenses WHERE user_id = $1';
    const params = [userId];
    
    if (lower.includes('last week')) {
      query += ' AND expense_date >= CURRENT_DATE - INTERVAL \'7 days\'';
    } else if (lower.includes('this month')) {
      query += ' AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE)';
    }
    
    query += ' ORDER BY amount DESC LIMIT 5';
    const result = await pool.query(query, params);
    const expenses = result.rows;
    
    if (expenses.length === 0) return { response: "No expenses found." };
    
    const list = expenses.map((e, i) => `${i + 1}. ${e.description || e.category} $${parseFloat(e.amount).toFixed(2)}`).join(', ');
    return { response: `Your biggest expenses: ${list}`, data: expenses };
  }
  
  // READ - Compare months
  if (lower.includes('compare')) {
    const thisMonth = await pool.query(
      'SELECT SUM(amount) as total, category FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE) GROUP BY category',
      [userId]
    );
    const lastMonth = await pool.query(
      'SELECT SUM(amount) as total, category FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE - INTERVAL \'1 month\') GROUP BY category',
      [userId]
    );
    
    const thisTotal = thisMonth.rows.reduce((sum, e) => sum + parseFloat(e.total), 0);
    const lastTotal = lastMonth.rows.reduce((sum, e) => sum + parseFloat(e.total), 0);
    const change = ((thisTotal - lastTotal) / lastTotal * 100).toFixed(1);
    
    return {
      response: `This month: $${thisTotal.toFixed(2)} | Last month: $${lastTotal.toFixed(2)} | ${change > 0 ? '+' : ''}${change}% change`,
      data: { thisMonth: thisMonth.rows, lastMonth: lastMonth.rows }
    };
  }
  
  // UPDATE - Change category or amount
  if (lower.includes('change') || lower.includes('update')) {
    if (!context.lastExpense) return { response: "I don't have a recent expense to update. Please be more specific." };
    
    const newCategory = categories.find(c => lower.includes(c.toLowerCase()));
    if (newCategory) {
      await pool.query('UPDATE expenses SET category = $1 WHERE id = $2', [newCategory, context.lastExpense.id]);
      return { response: `Updated category to ${newCategory}`, context };
    }
    
    const amountMatch = message.match(/\$?(\d+\.?\d*)/);
    if (amountMatch) {
      const newAmount = parseFloat(amountMatch[1]);
      await pool.query('UPDATE expenses SET amount = $1 WHERE id = $2', [newAmount, context.lastExpense.id]);
      return { response: `Updated amount to $${newAmount}`, context };
    }
  }
  
  // DELETE - Remove expenses
  if (lower.includes('delete') || lower.includes('remove')) {
    if (lower.includes('last')) {
      if (!context.lastExpense) {
        const result = await pool.query('SELECT * FROM expenses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1', [userId]);
        if (result.rows.length === 0) return { response: "No expenses to delete." };
        await pool.query('DELETE FROM expenses WHERE id = $1', [result.rows[0].id]);
        return { response: `Deleted $${parseFloat(result.rows[0].amount).toFixed(2)} ${result.rows[0].category} expense` };
      }
      await pool.query('DELETE FROM expenses WHERE id = $1', [context.lastExpense.id]);
      return { response: `Deleted $${context.lastExpense.amount} ${context.lastExpense.category} expense`, context: {} };
    }
  }
  
  // INSIGHTS
  if (lower.includes('insight') || lower.includes('analysis') || lower.includes('pattern')) {
    const result = await pool.query(
      'SELECT category, SUM(amount) as total FROM expenses WHERE user_id = $1 AND EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE) GROUP BY category ORDER BY total DESC',
      [userId]
    );
    const thisMonth = result.rows;
    
    if (thisMonth.length === 0) return { response: "Not enough data for insights yet." };
    
    const total = thisMonth.reduce((sum, e) => sum + parseFloat(e.total), 0);
    const top = thisMonth[0];
    const topPercent = (parseFloat(top.total) / total * 100).toFixed(1);
    
    return {
      response: `Your top spending category is ${top.category} at $${parseFloat(top.total).toFixed(2)} (${topPercent}% of total). Consider setting a budget to track this better.`,
      data: thisMonth
    };
  }
  
  // BUDGET CHECK
  if (lower.includes('budget') || lower.includes('on track')) {
    const result = await pool.query(
      `SELECT b.*, COALESCE(SUM(e.amount), 0) as spent 
       FROM budgets b 
       LEFT JOIN expenses e ON b.category = e.category AND e.user_id = b.user_id AND EXTRACT(MONTH FROM e.expense_date) = EXTRACT(MONTH FROM CURRENT_DATE)
       WHERE b.user_id = $1 
       GROUP BY b.id`,
      [userId]
    );
    const budgets = result.rows;
    
    if (budgets.length === 0) return { response: "You haven't set any budgets yet. Would you like to set one?" };
    
    const status = budgets.map(b => {
      const spent = parseFloat(b.spent);
      const limit = parseFloat(b.amount);
      const percent = (spent / limit * 100).toFixed(0);
      const status = spent > limit ? '⚠️ Over' : spent > limit * 0.8 ? '⚡ Close' : '✅ Good';
      return `${b.category}: ${status} ($${spent.toFixed(2)}/$${limit.toFixed(2)} - ${percent}%)`;
    }).join(', ');
    
    return { response: status, data: budgets };
  }
  
  return { response: "I can help you add expenses, check spending, update transactions, or provide insights. Try: 'I spent $50 on groceries' or 'How much did I spend on food this month?'" };
}

module.exports = { processMessage };
