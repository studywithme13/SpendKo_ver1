/* =============================================
   state.js  —  Shared app state & constants
   ============================================= */

let currentUser   = null;
let currentTheme  = 'light';
let selectedTheme = 'light';
let txnType       = 'income';

let transactions  = [];
let goals         = [];
let debts         = [];
let notes         = [];   /* Others tab — checklists & notepads */

/* othersSpent is no longer used (Others tab redesigned) */
let othersSpent   = {};
function rebuildOthersSpent() { othersSpent = {}; }

let budgets = {
  Food: 5000, Transport: 2000, Shopping: 3000,
  Bills: 2000, Health: 1500, Entertainment: 1500, Education: 2000
};

/* ── INCOME: only Salary, Freelance, Other (income source) ── */
const incomeCats  = ['Salary', 'Freelance', 'Other'];

/* ── EXPENSE: all spend categories except income sources ── */
const expenseCats = ['Food','Transport','Shopping','Bills','Health','Entertainment','Education','Savings','Other Expense'];

/* Monthly income this month (sum of income-type transactions) */
function monthlyIncome() {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  return transactions
    .filter(t => { const d = new Date(t.date); return d.getMonth()===m && d.getFullYear()===y && t.type==='income'; })
    .reduce((s,t) => s + t.amount, 0);
}

/* Total budget limits set (not spent — this is what's "allocated" as a plan) */
function totalBudgetAllocated() {
  return Object.values(budgets).reduce((s, v) => s + v, 0);
}

/* Total savings deposited this month (actual transfers to goals) */
function monthlySavingsDeposited() {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  return transactions
    .filter(t => { const d = new Date(t.date); return d.getMonth()===m && d.getFullYear()===y && t.cat==='Savings'; })
    .reduce((s,t) => s + t.amount, 0);
}

/*
  UNALLOCATED = Income − Budget Limits − Savings Deposited This Month
  This is the single source of truth used by Dashboard, Budget, and Savings tabs.
  - Income:           what came in (Salary + Freelance + Other income)
  - Budget allocated: the limits the user set per category (their spending plan)
  - Savings deposited: money the user actually moved to a savings goal this month
*/
function unallocatedMoney() {
  const inc    = monthlyIncome();
  const budg   = totalBudgetAllocated();
  const saving = monthlySavingsDeposited();
  return Math.max(0, inc - budg - saving);
}

let ratings = { overall: 0, ease: 0, design: 0 };
let nextId  = 100;

/* Sort state for transactions table */
let txnSortCol = 'date';
let txnSortDir = 'desc';

/* Date range filter */
let txnDateFrom = '';
let txnDateTo   = '';

const catEmojis = {
  Food:'🍜', Transport:'🚗', Shopping:'🛍', Bills:'⚡',
  Health:'💊', Entertainment:'🎬', Education:'📚',
  Salary:'💼', Freelance:'💻', Savings:'🏦', Other:'📌'
};

const catColors = [
  '#E6A800','#F5A623','#FF7043','#E53935','#8D6E63',
  '#FFB300','#0097A7','#E91E63','#43A047','#757575'
];

const debtTypeEmojis = {
  'Personal Loan':     '💳',
  'Credit Card':       '💳',
  'SSS / Pag-IBIG Loan':'🏛',
  'Home Loan':         '🏠',
  'Car Loan':          '🚗',
  'Student Loan':      '🎓',
  'Business Loan':     '💼',
  'Informal / Utang':  '🤝'
};

/* Remaining budget for a category this month */
function catBudgetRemaining(cat) {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  const limit = budgets[cat] || 0;
  const spent = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type==='expense' && t.cat===cat && d.getMonth()===m && d.getFullYear()===y;
    })
    .reduce((s,t) => s + t.amount, 0);
  return { limit, spent, remaining: limit - spent };
}

function seedData() {
  transactions = [];
  goals        = [];
  debts        = [];
  notes        = [];
}
