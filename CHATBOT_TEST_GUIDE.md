# AI Chatbot Test Guide

## Test Scenarios

### 1. CREATE Operations

#### Single Expense
```
Input: "I spent $45 on groceries at Whole Foods yesterday"
Expected: Creates expense with amount=$45, category=Groceries, merchant=Whole Foods, date=yesterday
Response: "Added $45 for Groceries at Whole Foods on [date]"
```

#### Multiple Expenses
```
Input: "Add coffee $5.50, lunch $18, and uber $12 from today"
Expected: Creates 3 expenses (Coffee, Food, Transport)
Response: "Added 3 expenses totaling $35.50 for today"
```

#### Auto-Categorization
```
Input: "Paid electricity bill $89"
Expected: Auto-categorizes as Bills
Response: "Added $89 for Bills on [date]"

Input: "Starbucks coffee $6.50"
Expected: Auto-categorizes as Coffee
Response: "Added $6.50 for Coffee on [date]"
```

### 2. READ Operations

#### Monthly Spending by Category
```
Input: "How much did I spend on food this month?"
Expected: Queries all food-related expenses for current month
Response: "You spent $342 on food this month: $180 on Groceries, $120 on Food, $42 on Coffee"
```

#### Biggest Expenses
```
Input: "Show me my biggest expenses from last week"
Expected: Returns top 5 expenses from past 7 days
Response: "Your biggest expenses last week: 1. Rent $1,200, 2. Groceries $85, 3. Gas $60"
```

#### Comparison
```
Input: "Compare my spending this month vs last month"
Expected: Calculates totals and percentage change
Response: "This month: $2,100 | Last month: $1,850 | +13.5% change"
```

#### Total Spending
```
Input: "How much did I spend today?"
Expected: Sum of all today's expenses
Response: "You spent $45.50 today"
```

### 3. UPDATE Operations

#### Update Category
```
Input: "Change the category of my last expense to transport"
Expected: Updates most recent expense category
Response: "Updated category to Transport for your $12 expense"
```

#### Update Amount
```
Input: "Update yesterday's grocery expense to $52"
Expected: Finds and updates the amount
Response: "Updated groceries expense from $45 to $52"
```

#### Context-Aware Update
```
Input: "I spent $45 on groceries"
Response: "Added $45 for Groceries on [date]"
Input: "Actually, make that $50"
Expected: Updates the just-added expense
Response: "Updated amount to $50"
```

### 4. DELETE Operations

#### Delete Last Expense
```
Input: "Delete that last expense"
Expected: Removes most recent expense
Response: "Deleted $12 Uber expense"
```

#### Bulk Delete
```
Input: "Remove all coffee expenses from this week"
Expected: Deletes all coffee expenses from past 7 days
Response: "Removed 5 coffee expenses totaling $27.50"
```

### 5. INSIGHTS & ANALYTICS

#### Spending Insights
```
Input: "Give me insights on my spending"
Expected: Analyzes patterns and provides recommendations
Response: "Your top spending category is Food at $342 (45% of total). Consider setting a budget to track this better."
```

#### Budget Tracking
```
Input: "Am I on track with my budget?"
Expected: Compares spending against budgets
Response: "Food: ⚠️ Over ($520/$500 - 104%), Transport: ✅ Good ($180/$300 - 60%)"
```

## Category Mapping

| Keywords | Category |
|----------|----------|
| grocery, groceries, whole foods, supermarket | Groceries |
| coffee, starbucks, cafe | Coffee |
| uber, taxi, bus, gas, fuel | Transport |
| restaurant, lunch, dinner, breakfast, food | Food |
| bill, electricity, water, rent, utility | Bills |
| movie, entertainment, game | Entertainment |
| shopping, clothes, amazon | Shopping |
| doctor, medicine, hospital, healthcare | Healthcare |

## Date Recognition

| Input | Parsed Date |
|-------|-------------|
| today | Current date |
| yesterday | Previous day |
| last week | 7 days ago |

## Testing Checklist

- [ ] Add single expense with natural language
- [ ] Add multiple expenses in one message
- [ ] Query monthly spending by category
- [ ] Show biggest expenses
- [ ] Compare months
- [ ] Update expense category
- [ ] Update expense amount
- [ ] Delete last expense
- [ ] Get spending insights
- [ ] Check budget status
- [ ] Test context awareness (update after add)
- [ ] Test auto-categorization
- [ ] Test date parsing
- [ ] Verify dashboard refreshes after chatbot operations

## Notes

- The chatbot maintains context per user session
- Dashboard automatically refreshes when expenses are added/updated/deleted via chat
- All operations require authentication (JWT token)
- Natural language parsing is case-insensitive
