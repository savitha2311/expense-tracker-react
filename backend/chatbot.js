const db = require('./db');

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
  const amountRegex = /\$?(\d+\.?\d*)/g;
  const amounts = [...text.matchAll(amountRegex)].map(m => parseFloat(m[1]));
  
  const parts = text.split(/,| and /);
  parts.forEach((part, i) => {
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
      const [result] = await db.query(
        'INSERT INTO expenses (user_id, amount, category, description, merchant, expense_date) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, exp.amount, exp.category, exp.description, exp.merchant, exp.date]
      );
      results.push({ id: result.insertId, ...exp });
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
    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [userId];
    
    if (lower.includes('this month')) {
      query += ' AND MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())';
    } else if (lower.includes('last month')) {
      query += ' AND MONTH(expense_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(expense_date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
    } else if (lower.includes('last week') || lower.includes('past week')) {
      query += ' AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (lower.includes('today')) {
      query += ' AND DATE(expense_date) = CURDATE()';
    }
    
    const category = categories.find(c => lower.includes(c.toLowerCase()));
    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    
    const [expenses] = await db.query(query, params);
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
    let query = 'SELECT * FROM expenses WHERE user_id = ?';
    const params = [userId];
    
    if (lower.includes('last week')) {
      query += ' AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
    } else if (lower.includes('this month')) {
      query += ' AND MONTH(expense_date) = MONTH(CURDATE())';
    }
    
    query += ' ORDER BY amount DESC LIMIT 5';
    const [expenses] = await db.query(query, params);
    
    if (expenses.length === 0) return { response: "No expenses found." };
    
    const list = expenses.map((e, i) => `${i + 1}. ${e.description || e.category} $${parseFloat(e.amount).toFixed(2)}`).join(', ');
    return { response: `Your biggest expenses: ${list}`, data: expenses };
  }
  
  // READ - Compare months
  if (lower.includes('compare')) {
    const [thisMonth] = await db.query(
      'SELECT SUM(amount) as total, category FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) GROUP BY category',
      [userId]
    );
    const [lastMonth] = await db.query(
      'SELECT SUM(amount) as total, category FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) GROUP BY category',
      [userId]
    );
    
    const thisTotal = thisMonth.reduce((sum, e) => sum + parseFloat(e.total), 0);
    const lastTotal = lastMonth.reduce((sum, e) => sum + parseFloat(e.total), 0);
    const change = ((thisTotal - lastTotal) / lastTotal * 100).toFixed(1);
    
    return {
      response: `This month: $${thisTotal.toFixed(2)} | Last month: $${lastTotal.toFixed(2)} | ${change > 0 ? '+' : ''}${change}% change`,
      data: { thisMonth, lastMonth }
    };
  }
  
  // UPDATE - Change category or amount
  if (lower.includes('change') || lower.includes('update')) {
    if (!context.lastExpense) return { response: "I don't have a recent expense to update. Please be more specific." };
    
    const newCategory = categories.find(c => lower.includes(c.toLowerCase()));
    if (newCategory) {
      await db.query('UPDATE expenses SET category = ? WHERE id = ?', [newCategory, context.lastExpense.id]);
      return { response: `Updated category to ${newCategory}`, context };
    }
    
    const amountMatch = message.match(/\$?(\d+\.?\d*)/);
    if (amountMatch) {
      const newAmount = parseFloat(amountMatch[1]);
      await db.query('UPDATE expenses SET amount = ? WHERE id = ?', [newAmount, context.lastExpense.id]);
      return { response: `Updated amount to $${newAmount}`, context };
    }
  }
  
  // DELETE - Remove expenses
  if (lower.includes('delete') || lower.includes('remove')) {
    if (lower.includes('last')) {
      if (!context.lastExpense) {
        const [expenses] = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
        if (expenses.length === 0) return { response: "No expenses to delete." };
        await db.query('DELETE FROM expenses WHERE id = ?', [expenses[0].id]);
        return { response: `Deleted $${parseFloat(expenses[0].amount).toFixed(2)} ${expenses[0].category} expense` };
      }
      await db.query('DELETE FROM expenses WHERE id = ?', [context.lastExpense.id]);
      return { response: `Deleted $${context.lastExpense.amount} ${context.lastExpense.category} expense`, context: {} };
    }
  }
  
  // INSIGHTS
  if (lower.includes('insight') || lower.includes('analysis') || lower.includes('pattern')) {
    const [thisMonth] = await db.query(
      'SELECT category, SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) GROUP BY category ORDER BY total DESC',
      [userId]
    );
    
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
    const [budgets] = await db.query(
      `SELECT b.*, COALESCE(SUM(e.amount), 0) as spent 
       FROM budgets b 
       LEFT JOIN expenses e ON b.category = e.category AND e.user_id = b.user_id AND MONTH(e.expense_date) = MONTH(CURDATE()) 
       WHERE b.user_id = ? 
       GROUP BY b.id`,
      [userId]
    );
    
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
