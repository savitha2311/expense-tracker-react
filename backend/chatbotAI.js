const OpenAI = require('openai');
const db = require('./db');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const categories = ['Food', 'Groceries', 'Transport', 'Coffee', 'Bills', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];

async function processMessageWithAI(message, userId, context = {}) {
  try {
    const systemPrompt = `You are an AI expense tracking assistant. Extract expense information from user messages and respond in JSON format.

Available categories: ${categories.join(', ')}

For CREATE operations, respond with:
{
  "action": "create",
  "expenses": [{"amount": number, "category": string, "description": string, "merchant": string, "date": "YYYY-MM-DD"}]
}

For READ operations, respond with:
{
  "action": "read",
  "query": {"type": "total|biggest|compare", "category": string, "period": "today|this month|last week|last month"}
}

For UPDATE operations, respond with:
{
  "action": "update",
  "field": "category|amount",
  "value": string|number
}

For DELETE operations, respond with:
{
  "action": "delete",
  "target": "last|all",
  "filter": {"category": string, "period": string}
}

For INSIGHTS, respond with:
{
  "action": "insights"
}

For BUDGET, respond with:
{
  "action": "budget"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Process based on action
    switch (aiResponse.action) {
      case 'create':
        return await handleCreate(aiResponse.expenses, userId);
      
      case 'read':
        return await handleRead(aiResponse.query, userId);
      
      case 'update':
        return await handleUpdate(aiResponse, userId, context);
      
      case 'delete':
        return await handleDelete(aiResponse, userId, context);
      
      case 'insights':
        return await handleInsights(userId);
      
      case 'budget':
        return await handleBudget(userId);
      
      default:
        return { response: "I can help you add expenses, check spending, update transactions, or provide insights." };
    }
  } catch (error) {
    console.error('OpenAI Error:', error);
    return { response: "Sorry, I encountered an error processing your request." };
  }
}

async function handleCreate(expenses, userId) {
  const results = [];
  for (const exp of expenses) {
    const [result] = await db.query(
      'INSERT INTO expenses (user_id, amount, category, description, merchant, expense_date) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, exp.amount, exp.category, exp.description, exp.merchant || '', exp.date]
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
      response: `Added ${expenses.length} expenses totaling $${total.toFixed(2)}`,
      data: results,
      context: { lastExpenses: results }
    };
  }
}

async function handleRead(query, userId) {
  let sqlQuery = 'SELECT * FROM expenses WHERE user_id = ?';
  const params = [userId];

  if (query.period === 'this month') {
    sqlQuery += ' AND MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())';
  } else if (query.period === 'last month') {
    sqlQuery += ' AND MONTH(expense_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
  } else if (query.period === 'last week') {
    sqlQuery += ' AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)';
  } else if (query.period === 'today') {
    sqlQuery += ' AND DATE(expense_date) = CURDATE()';
  }

  if (query.category) {
    sqlQuery += ' AND category = ?';
    params.push(query.category);
  }

  if (query.type === 'biggest') {
    sqlQuery += ' ORDER BY amount DESC LIMIT 5';
  }

  const [expenses] = await db.query(sqlQuery, params);
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  if (query.type === 'compare') {
    const [lastMonth] = await db.query(
      'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))',
      [userId]
    );
    const lastTotal = parseFloat(lastMonth[0]?.total || 0);
    const change = lastTotal > 0 ? ((total - lastTotal) / lastTotal * 100).toFixed(1) : 0;
    return { response: `This month: $${total.toFixed(2)} | Last month: $${lastTotal.toFixed(2)} | ${change > 0 ? '+' : ''}${change}% change` };
  }

  if (query.type === 'biggest') {
    const list = expenses.map((e, i) => `${i + 1}. ${e.description || e.category} $${parseFloat(e.amount).toFixed(2)}`).join(', ');
    return { response: `Your biggest expenses: ${list}`, data: expenses };
  }

  return { response: `You spent $${total.toFixed(2)}${query.category ? ' on ' + query.category : ''}${query.period ? ' ' + query.period : ''}`, data: expenses };
}

async function handleUpdate(data, userId, context) {
  if (!context.lastExpense) {
    return { response: "I don't have a recent expense to update." };
  }

  if (data.field === 'category') {
    await db.query('UPDATE expenses SET category = ? WHERE id = ?', [data.value, context.lastExpense.id]);
    return { response: `Updated category to ${data.value}`, context };
  } else if (data.field === 'amount') {
    await db.query('UPDATE expenses SET amount = ? WHERE id = ?', [data.value, context.lastExpense.id]);
    return { response: `Updated amount to $${data.value}`, context };
  }
}

async function handleDelete(data, userId, context) {
  if (data.target === 'last') {
    const expenseId = context.lastExpense?.id;
    if (!expenseId) {
      const [expenses] = await db.query('SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [userId]);
      if (expenses.length === 0) return { response: "No expenses to delete." };
      await db.query('DELETE FROM expenses WHERE id = ?', [expenses[0].id]);
      return { response: `Deleted $${parseFloat(expenses[0].amount).toFixed(2)} ${expenses[0].category} expense` };
    }
    await db.query('DELETE FROM expenses WHERE id = ?', [expenseId]);
    return { response: `Deleted expense`, context: {} };
  }
}

async function handleInsights(userId) {
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

async function handleBudget(userId) {
  const [budgets] = await db.query(
    `SELECT b.*, COALESCE(SUM(e.amount), 0) as spent 
     FROM budgets b 
     LEFT JOIN expenses e ON b.category = e.category AND e.user_id = b.user_id AND MONTH(e.expense_date) = MONTH(CURDATE()) 
     WHERE b.user_id = ? 
     GROUP BY b.id`,
    [userId]
  );

  if (budgets.length === 0) return { response: "You haven't set any budgets yet." };

  const status = budgets.map(b => {
    const spent = parseFloat(b.spent);
    const limit = parseFloat(b.amount);
    const percent = (spent / limit * 100).toFixed(0);
    const status = spent > limit ? '⚠️ Over' : spent > limit * 0.8 ? '⚡ Close' : '✅ Good';
    return `${b.category}: ${status} ($${spent.toFixed(2)}/$${limit.toFixed(2)} - ${percent}%)`;
  }).join(', ');

  return { response: status, data: budgets };
}

module.exports = { processMessageWithAI };
