/* =============================================
   transactions.js  —  Transactions panel
   ============================================= */

function openModal() {
  txnType = 'income';
  setType('income');
  /* Reset hint */
  const hint = document.getElementById('txn-budget-hint');
  if (hint) hint.style.display = 'none';
  document.getElementById('modal').classList.add('open');
}
function closeModal() { document.getElementById('modal').classList.remove('open'); }

const INCOME_CATS = [
  { val: 'Salary',    label: '💼 Salary' },
  { val: 'Freelance', label: '💻 Freelance' },
  { val: 'Other',     label: '📌 Other Income' },
];
const EXPENSE_CATS = [
  { val: 'Food',          label: '🍜 Food' },
  { val: 'Transport',     label: '🚗 Transport' },
  { val: 'Shopping',      label: '🛍 Shopping' },
  { val: 'Bills',         label: '⚡ Bills' },
  { val: 'Health',        label: '💊 Health' },
  { val: 'Entertainment', label: '🎬 Entertainment' },
  { val: 'Education',     label: '📚 Education' },
  { val: 'Savings',       label: '🏦 Savings' },
  { val: 'Other Expense', label: '📌 Other Expense' },
];

function setType(type) {
  txnType = type;
  document.getElementById('type-income') .className='type-opt'+(type==='income' ?' sel-income' :'');
  document.getElementById('type-expense').className='type-opt'+(type==='expense'?' sel-expense':'');
  /* Swap category dropdown */
  const sel  = document.getElementById('txn-cat');
  const cats = type === 'income' ? INCOME_CATS : EXPENSE_CATS;
  sel.innerHTML = cats.map(c=>`<option value="${c.val}">${c.label}</option>`).join('');
  updateBudgetHint();
}

/* Show budget remaining hint under the category dropdown when in expense mode */
function updateBudgetHint() {
  const hint = document.getElementById('txn-budget-hint');
  if (!hint) return;
  if (txnType !== 'expense') { hint.style.display = 'none'; return; }
  const cat = document.getElementById('txn-cat').value;
  if (cat === 'Savings' || cat === 'Other Expense') { hint.style.display = 'none'; return; }
  const { limit, spent, remaining } = catBudgetRemaining(cat);
  if (limit === 0) {
    hint.style.display     = 'block';
    hint.innerHTML         = `🚫 No budget set for <strong>${cat}</strong> — you cannot spend here yet. <a href="#" onclick="closeModal();switchTab('budget',document.querySelectorAll('.tab-btn')[2]);return false;" style="color:var(--accent);text-decoration:underline">Set budget →</a>`;
    hint.style.color       = 'var(--danger)';
    hint.style.background  = 'var(--danger2)';
    hint.style.borderColor = 'var(--danger)';
  } else if (remaining <= 0) {
    hint.style.display     = 'block';
    hint.innerHTML         = `🚫 <strong>${cat}</strong> budget fully used — ₱0 remaining. You cannot add this expense.`;
    hint.style.color       = 'var(--danger)';
    hint.style.background  = 'var(--danger2)';
    hint.style.borderColor = 'var(--danger)';
  } else if (remaining < limit * 0.2) {
    hint.style.display     = 'block';
    hint.innerHTML         = `⚠️ <strong>${cat}</strong> is almost full — only <strong>₱${remaining.toLocaleString()}</strong> of ₱${limit.toLocaleString()} left.`;
    hint.style.color       = 'var(--warn)';
    hint.style.background  = 'var(--warn2)';
    hint.style.borderColor = 'var(--warn)';
  } else {
    hint.style.display     = 'block';
    hint.innerHTML         = `✅ <strong>${cat}</strong> budget remaining: <strong>₱${remaining.toLocaleString()}</strong> of ₱${limit.toLocaleString()}`;
    hint.style.color       = 'var(--text2)';
    hint.style.background  = 'var(--bg3)';
    hint.style.borderColor = 'var(--border)';
  }
}

function saveTransaction() {
  const desc   = document.getElementById('txn-desc').value.trim();
  const amount = parseFloat(document.getElementById('txn-amount').value);
  const date   = document.getElementById('txn-date').value;
  const cat    = document.getElementById('txn-cat').value;
  if (!desc)              { showToast('Please enter a description'); return; }
  if (!amount||amount<=0) { showToast('Please enter a valid amount'); return; }
  if (!date)              { showToast('Please select a date'); return; }

  /* ── Budget check for expenses — hard block, no overspending allowed ── */
  if (txnType === 'expense' && cat !== 'Savings' && cat !== 'Other Expense') {
    const { limit, spent, remaining } = catBudgetRemaining(cat);

    if (limit === 0) {
      showToast(`No budget set for "${cat}". Set one in the Budget tab first.`);
      /* Also show a more detailed alert */
      alert(
        `🚫 No budget set for "${cat}".\n\n` +
        `You need to allocate a budget for this category before spending.\n\n` +
        `Go to the Budget tab → set a limit for ${cat} → then try again.`
      );
      return;
    }

    if (amount > remaining) {
      if (remaining <= 0) {
        showToast(`"${cat}" budget is fully used (₱0 left). Choose a different category or adjust your budget.`);
        alert(
          `🚫 No budget remaining for "${cat}"!\n\n` +
          `Budget limit:  ₱${limit.toLocaleString()}\n` +
          `Already spent: ₱${spent.toLocaleString()}\n` +
          `Remaining:     ₱0\n\n` +
          `You cannot add this expense. Please:\n` +
          `• Choose a different category, or\n` +
          `• Go to the Budget tab and increase the "${cat}" limit.`
        );
      } else {
        showToast(`Not enough budget. Only ₱${remaining.toLocaleString()} left for "${cat}".`);
        alert(
          `🚫 Not enough budget for "${cat}"!\n\n` +
          `Budget limit:  ₱${limit.toLocaleString()}\n` +
          `Already spent: ₱${spent.toLocaleString()}\n` +
          `Remaining:     ₱${remaining.toLocaleString()}\n` +
          `This expense:  ₱${amount.toLocaleString()}\n\n` +
          `Please enter an amount of ₱${remaining.toLocaleString()} or less,\n` +
          `or go to the Budget tab and increase the "${cat}" limit.`
        );
      }
      return;  /* Hard stop — do not save */
    }
  }

  transactions.push({ id:nextId++, desc, amount, type:txnType, cat, date });
  closeModal();
  document.getElementById('txn-desc').value='';
  document.getElementById('txn-amount').value='';
  renderAll();
  showToast(`${txnType==='income'?'Income':'Expense'} added!`);
}

function deleteTransaction(id) {
  transactions = transactions.filter(t=>t.id!==id);
  renderAll();
  showToast('Transaction deleted');
}

/* ── Sorting ── */
function sortBy(col) {
  if (txnSortCol===col) txnSortDir = txnSortDir==='asc'?'desc':'asc';
  else { txnSortCol=col; txnSortDir='desc'; }
  renderTransactions();
}

function sortIcon(col) {
  if (txnSortCol!==col) return '<span style="opacity:.3;font-size:11px">⇅</span>';
  return txnSortDir==='asc'
    ? '<span style="font-size:11px;color:var(--accent)">↑</span>'
    : '<span style="font-size:11px;color:var(--accent)">↓</span>';
}

/* ── Render ── */
function renderTransactions() {
  const search    = document.getElementById('search-box').value.toLowerCase();
  const typeF     = document.getElementById('filter-type').value;
  const catF      = document.getElementById('filter-cat');
  const dateFrom  = document.getElementById('filter-date-from').value;
  const dateTo    = document.getElementById('filter-date-to').value;

  /* Rebuild category dropdown */
  const cats = [...new Set(transactions.map(t=>t.cat))];
  const cv   = catF.value;
  catF.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option value="${c}">${c}</option>`).join('');
  catF.value = cats.includes(cv)?cv:'all';

  let filtered = transactions.filter(t=>{
    if (typeF!=='all'&&t.type!==typeF) return false;
    if (catF.value!=='all'&&t.cat!==catF.value) return false;
    if (search&&!t.desc.toLowerCase().includes(search)&&!t.cat.toLowerCase().includes(search)) return false;
    if (dateFrom&&t.date<dateFrom) return false;
    if (dateTo  &&t.date>dateTo)   return false;
    return true;
  });

  /* Sort */
  filtered.sort((a,b)=>{
    let av,bv;
    if (txnSortCol==='desc')   { av=a.desc.toLowerCase();   bv=b.desc.toLowerCase(); }
    else if (txnSortCol==='cat')    { av=a.cat;                 bv=b.cat; }
    else if (txnSortCol==='type')   { av=a.type;                bv=b.type; }
    else if (txnSortCol==='amount') { av=a.amount;              bv=b.amount; }
    else                            { av=a.date;                bv=b.date; }
    if (av<bv) return txnSortDir==='asc'?-1:1;
    if (av>bv) return txnSortDir==='asc'?1:-1;
    return 0;
  });

  /* Update sortable headers */
  document.getElementById('th-desc')  .innerHTML=`Description ${sortIcon('desc')}`;
  document.getElementById('th-cat')   .innerHTML=`Category ${sortIcon('cat')}`;
  document.getElementById('th-type')  .innerHTML=`Type ${sortIcon('type')}`;
  document.getElementById('th-date')  .innerHTML=`Date ${sortIcon('date')}`;
  document.getElementById('th-amount').innerHTML=`Amount ${sortIcon('amount')}`;

  const tbody = document.getElementById('txn-table-body');
  tbody.innerHTML='';
  if (!filtered.length) {
    tbody.innerHTML='<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text3)">No transactions found</td></tr>';
    return;
  }
  filtered.forEach(t=>{
    tbody.innerHTML+=`<tr>
      <td><strong>${t.desc}</strong></td>
      <td>${catEmojis[t.cat]||''} ${t.cat}</td>
      <td><span class="badge badge-${t.type}">${t.type==='income'?'Income':'Expense'}</span></td>
      <td>${new Date(t.date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</td>
      <td class="${t.type==='income'?'txn-income':'txn-expense'}" style="font-weight:600">
        ${t.type==='income'?'+':'-'}₱${t.amount.toLocaleString()}</td>
      <td><button class="del-btn" onclick="deleteTransaction(${t.id})">✕</button></td></tr>`;
  });
}
