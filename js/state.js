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
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  const mm = String(m+1).padStart(2,'0');
  transactions = [
    { id:1, desc:'Monthly salary',    amount:38000, type:'income',  cat:'Salary',       date:`${y}-${mm}-01` },
    { id:2, desc:'Grocery shopping',  amount:2800,  type:'expense', cat:'Food',          date:`${y}-${mm}-03` },
    { id:3, desc:'Electric bill',     amount:1500,  type:'expense', cat:'Bills',         date:`${y}-${mm}-05` },
    { id:4, desc:'Freelance project', amount:8500,  type:'income',  cat:'Freelance',     date:`${y}-${mm}-08` },
    { id:5, desc:'Grab ride',         amount:280,   type:'expense', cat:'Transport',     date:`${y}-${mm}-09` },
    { id:6, desc:'Netflix',           amount:459,   type:'expense', cat:'Entertainment', date:`${y}-${mm}-10` },
    { id:7, desc:'Tuition fee',       amount:12000, type:'expense', cat:'Education',     date:`${y}-${mm}-12` },
    { id:8, desc:'Medicine',          amount:850,   type:'expense', cat:'Health',        date:`${y}-${mm}-14` },
  ];
  goals = [
    { id:10, name:'Emergency Fund', emoji:'💊', target:50000, saved:18000 },
    { id:11, name:'Laptop',         emoji:'📱', target:45000, saved:12000 },
  ];
  debts = [
    { id:20, name:'SSS Salary Loan',   type:'SSS / Pag-IBIG Loan', total:20000, paid:8000,  interest:10, monthly:1500, start:`${y}-01-01`, endDate:`${y}-12-31`, due:15, notes:'Auto-deducted from payroll', payments:[] },
    { id:21, name:'Credit Card — BPI', type:'Credit Card',          total:25000, paid:5000,  interest:24, monthly:2000, start:`${y}-01-01`, endDate:`${y}-12-31`, due:20, notes:'Min payment: ₱1,500',        payments:[] },
  ];
  notes = [];
}
