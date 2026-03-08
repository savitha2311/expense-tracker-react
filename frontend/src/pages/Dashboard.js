import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseAPI, statsAPI, budgetAPI } from '../services/api';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import Chatbot from '../components/Chatbot';
import './Dashboard.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement);

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetForm, setBudgetForm] = useState({ category: 'Food', amount: '' });
  const [activeView, setActiveView] = useState('dashboard');
  const [filters, setFilters] = useState({ category: '', search: '', dateFrom: '', dateTo: '', sortBy: 'date' });
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    description: '',
    merchant: '',
    paymentMethod: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const navigate = useNavigate();

  const categories = ['Food', 'Groceries', 'Transport', 'Coffee', 'Bills', 'Entertainment', 'Shopping', 'Healthcare', 'Other'];

  const loadData = useCallback(async () => {
    try {
      const [expensesRes, statsRes, budgetsRes] = await Promise.all([
        expenseAPI.getAll(),
        statsAPI.get(),
        budgetAPI.getAll()
      ]);
      setExpenses(expensesRes.data);
      setStats(statsRes.data);
      setBudgets(budgetsRes.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/');
      }
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await expenseAPI.create(formData);
      setShowModal(false);
      setFormData({
        amount: '',
        category: 'Food',
        description: '',
        merchant: '',
        paymentMethod: '',
        expenseDate: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      alert('Error adding expense');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this expense?')) {
      await expenseAPI.delete(id);
      loadData();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Category', 'Amount', 'Description', 'Merchant', 'Payment Method'];
    const rows = expenses.map(exp => [
      new Date(exp.expense_date).toLocaleDateString(),
      exp.category,
      exp.amount,
      exp.description || '',
      exp.merchant || '',
      exp.payment_method || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      await budgetAPI.create(budgetForm);
      setShowBudgetModal(false);
      setBudgetForm({ category: 'Food', amount: '' });
      loadData();
    } catch (err) {
      alert('Error setting budget');
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    if (filters.category && exp.category !== filters.category) return false;
    if (filters.search && !exp.description?.toLowerCase().includes(filters.search.toLowerCase()) && !exp.merchant?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.dateFrom && new Date(exp.expense_date) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(exp.expense_date) > new Date(filters.dateTo)) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sortBy === 'date') return new Date(b.expense_date) - new Date(a.expense_date);
    if (filters.sortBy === 'amount') return b.amount - a.amount;
    if (filters.sortBy === 'category') return a.category.localeCompare(b.category);
    return 0;
  });

  const exportFilteredCSV = () => {
    const headers = ['Date', 'Category', 'Amount', 'Description', 'Merchant', 'Payment Method'];
    const rows = filteredExpenses.map(exp => [
      new Date(exp.expense_date).toLocaleDateString(),
      exp.category,
      exp.amount,
      exp.description || '',
      exp.merchant || '',
      exp.payment_method || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered_expenses_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const monthlyTrend = expenses.reduce((acc, exp) => {
    const month = new Date(exp.expense_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    acc[month] = (acc[month] || 0) + parseFloat(exp.amount);
    return acc;
  }, {});

  const trendData = {
    labels: Object.keys(monthlyTrend),
    datasets: [{
      label: 'Monthly Spending',
      data: Object.values(monthlyTrend),
      backgroundColor: 'rgba(102, 126, 234, 0.5)',
      borderColor: '#667eea',
      borderWidth: 2
    }]
  };

  const merchantData = expenses.reduce((acc, exp) => {
    if (exp.merchant) {
      acc[exp.merchant] = (acc[exp.merchant] || 0) + parseFloat(exp.amount);
    }
    return acc;
  }, {});

  const topMerchants = Object.entries(merchantData).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.expense_date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const lastMonth = expenses.filter(e => {
    const d = new Date(e.expense_date);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
    return d.getMonth() === lastMonthDate.getMonth() && d.getFullYear() === lastMonthDate.getFullYear();
  }).reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const monthChange = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth * 100).toFixed(1) : 0;

  const chartData = {
    labels: stats.categoryBreakdown?.map(c => c.category) || [],
    datasets: [{
      data: stats.categoryBreakdown?.map(c => c.total) || [],
      backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140', '#30cfd0']
    }]
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>💰 ExpenseAI</h2>
        <div className={activeView === 'dashboard' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('dashboard')}>📊 Dashboard</div>
        <div className={activeView === 'expenses' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('expenses')}>📜 Transaction History</div>
        <div className={activeView === 'budgets' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('budgets')}>🎯 Budgets</div>
        <div className={activeView === 'analytics' ? 'nav-item active' : 'nav-item'} onClick={() => setActiveView('analytics')}>📈 Analytics</div>
        <div className="user-info">
          <p>{JSON.parse(localStorage.getItem('user')).fullName}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="main-content">
        <div className="header">
          <h1>Dashboard</h1>
          <div>
            <button className="btn-secondary" onClick={exportToCSV} style={{marginRight: '10px'}}>📥 Export CSV</button>
            <button className="btn-primary" onClick={() => setShowModal(true)}>+ Add Expense</button>
          </div>
        </div>

        <div className="content">
          {activeView === 'dashboard' && (
            <>
              <div className="stats">
                <div className="stat-card">
                  <h3>Total Expenses</h3>
                  <div className="value">${Number(stats.totalExpenses || 0).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <h3>This Month</h3>
                  <div className="value">${Number(stats.monthlyExpenses || 0).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <h3>Transactions</h3>
                  <div className="value">{expenses.length}</div>
                </div>
              </div>

              <div className="card">
                <h2>Category Breakdown</h2>
                {stats.categoryBreakdown?.length > 0 ? (
                  <div className="chart-container">
                    <Doughnut data={chartData} />
                  </div>
                ) : (
                  <p>No expenses yet</p>
                )}
              </div>

              <div className="card">
                <h2>Recent Transactions (Last 10)</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice(0, 10).map(exp => (
                      <tr key={exp.id}>
                        <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                        <td><span className="badge">{exp.category}</span></td>
                        <td>{exp.description}</td>
                        <td className="amount">${Number(exp.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeView === 'expenses' && (
            <div className="card">
              <div style={{marginBottom: '20px'}}>
                <h2>Transaction History</h2>
                <div className="filters">
                  <input type="text" placeholder="Search description/merchant" value={filters.search} onChange={(e) => setFilters({...filters, search: e.target.value})} />
                  <select value={filters.category} onChange={(e) => setFilters({...filters, category: e.target.value})}>
                    <option value="">All Categories</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <input type="date" placeholder="From" value={filters.dateFrom} onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} />
                  <input type="date" placeholder="To" value={filters.dateTo} onChange={(e) => setFilters({...filters, dateTo: e.target.value})} />
                  <select value={filters.sortBy} onChange={(e) => setFilters({...filters, sortBy: e.target.value})}>
                    <option value="date">Sort by Date</option>
                    <option value="amount">Sort by Amount</option>
                    <option value="category">Sort by Category</option>
                  </select>
                  <button className="btn-secondary" onClick={exportFilteredCSV}>📥 Export</button>
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Merchant</th>
                    <th>Payment</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                      <td><span className="badge">{exp.category}</span></td>
                      <td>{exp.description}</td>
                      <td>{exp.merchant || '-'}</td>
                      <td>{exp.payment_method || '-'}</td>
                      <td className="amount">${Number(exp.amount).toFixed(2)}</td>
                      <td>
                        <button className="btn-danger" onClick={() => handleDelete(exp.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{marginTop: '10px', color: '#666'}}>Showing {filteredExpenses.length} of {expenses.length} expenses</p>
            </div>
          )}

          {activeView === 'budgets' && (
            <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                <h2>Budget Management</h2>
                <button className="btn-primary" onClick={() => setShowBudgetModal(true)}>+ Set Budget</button>
              </div>
              {budgets.length > 0 ? (
                <div className="budget-list">
                  {budgets.map(budget => {
                    const spent = parseFloat(budget.spent || 0);
                    const limit = parseFloat(budget.amount);
                    const percent = Math.min((spent / limit) * 100, 100);
                    const isOver = spent > limit;
                    const isWarning = spent > limit * 0.8;
                    return (
                      <div key={budget.id} className="budget-item">
                        <div className="budget-header">
                          <span className="budget-category">{budget.category}</span>
                          <span className={`budget-status ${isOver ? 'over' : isWarning ? 'warning' : 'good'}`}>
                            {isOver ? '⚠️ Over Budget' : isWarning ? '⚡ Close to Limit' : '✅ On Track'}
                          </span>
                        </div>
                        <div className="budget-progress">
                          <div className="progress-bar">
                            <div className={`progress-fill ${isOver ? 'over' : isWarning ? 'warning' : 'good'}`} style={{width: `${percent}%`}}></div>
                          </div>
                          <div className="budget-amounts">
                            <span>${spent.toFixed(2)} / ${limit.toFixed(2)}</span>
                            <span>{percent.toFixed(0)}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p>No budgets set. Click "Set Budget" to add one.</p>
              )}
            </div>
          )}

          {activeView === 'analytics' && (
            <>
              <div className="stats">
                <div className="stat-card">
                  <h3>Total Expenses</h3>
                  <div className="value">${Number(stats.totalExpenses || 0).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <h3>This Month</h3>
                  <div className="value">${Number(stats.monthlyExpenses || 0).toFixed(2)}</div>
                </div>
                <div className="stat-card">
                  <h3>Average/Transaction</h3>
                  <div className="value">${expenses.length > 0 ? (Number(stats.totalExpenses || 0) / expenses.length).toFixed(2) : '0.00'}</div>
                </div>
              </div>

              <div className="card">
                <h2>Spending Trend Over Time</h2>
                <div className="chart-container-wide">
                  <Bar data={trendData} options={{responsive: true, maintainAspectRatio: true}} />
                </div>
              </div>

              <div className="card">
                <h2>Month-over-Month Comparison</h2>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '20px'}}>
                  <div style={{textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px'}}>
                    <h4 style={{color: '#666', marginBottom: '10px'}}>Last Month</h4>
                    <div style={{fontSize: '28px', fontWeight: 'bold', color: '#667eea'}}>${lastMonth.toFixed(2)}</div>
                  </div>
                  <div style={{textAlign: 'center', padding: '20px', background: '#f8f9fa', borderRadius: '8px'}}>
                    <h4 style={{color: '#666', marginBottom: '10px'}}>This Month</h4>
                    <div style={{fontSize: '28px', fontWeight: 'bold', color: '#667eea'}}>${thisMonth.toFixed(2)}</div>
                  </div>
                  <div style={{textAlign: 'center', padding: '20px', background: monthChange >= 0 ? '#fff3cd' : '#d4edda', borderRadius: '8px'}}>
                    <h4 style={{color: '#666', marginBottom: '10px'}}>Change</h4>
                    <div style={{fontSize: '28px', fontWeight: 'bold', color: monthChange >= 0 ? '#856404' : '#155724'}}>
                      {monthChange >= 0 ? '+' : ''}{monthChange}%
                    </div>
                  </div>
                </div>
              </div>

              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
                <div className="card">
                  <h2>Category Breakdown</h2>
                  {stats.categoryBreakdown?.length > 0 ? (
                    <div className="chart-container">
                      <Doughnut data={chartData} />
                    </div>
                  ) : (
                    <p>No expenses yet</p>
                  )}
                </div>

                <div className="card">
                  <h2>Top Merchants</h2>
                  <table>
                    <thead>
                      <tr>
                        <th>Merchant</th>
                        <th>Total Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topMerchants.map(([merchant, amount]) => (
                        <tr key={merchant}>
                          <td>{merchant}</td>
                          <td className="amount">${Number(amount).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h2>Category Analysis</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total Spent</th>
                      <th>% of Total</th>
                      <th>Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.categoryBreakdown?.map(cat => {
                      const count = expenses.filter(e => e.category === cat.category).length;
                      return (
                        <tr key={cat.category}>
                          <td><span className="badge">{cat.category}</span></td>
                          <td className="amount">${Number(cat.total).toFixed(2)}</td>
                          <td>{((Number(cat.total) / Number(stats.monthlyExpenses || 1)) * 100).toFixed(1)}%</td>
                          <td>{count}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Expense</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
              />
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({...formData, expenseDate: e.target.value})}
                required
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
              <input
                type="text"
                placeholder="Merchant"
                value={formData.merchant}
                onChange={(e) => setFormData({...formData, merchant: e.target.value})}
              />
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
              >
                <option value="">Select Payment Method</option>
                <option value="Cash">Cash</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="UPI">UPI</option>
              </select>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Add Expense</button>
                <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBudgetModal && (
        <div className="modal" onClick={() => setShowBudgetModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Set Budget</h2>
            <form onSubmit={handleBudgetSubmit}>
              <select
                value={budgetForm.category}
                onChange={(e) => setBudgetForm({...budgetForm, category: e.target.value})}
                required
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <input
                type="number"
                step="0.01"
                placeholder="Budget Amount"
                value={budgetForm.amount}
                onChange={(e) => setBudgetForm({...budgetForm, amount: e.target.value})}
                required
              />
              <div className="form-actions">
                <button type="submit" className="btn-primary">Set Budget</button>
                <button type="button" onClick={() => setShowBudgetModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Chatbot onExpenseChange={loadData} />
    </div>
  );
}

export default Dashboard;
