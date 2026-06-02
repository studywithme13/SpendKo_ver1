/* =============================================
   budget.js  —  Budget Planner panel
   ============================================= */

function renderBudgets() {
  const now=new Date(), m=now.getMonth(), y=now.getFullYear();
  const mt=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y&&t.type==='expense';});

  /* Unallocated banner */
  const inc      = monthlyIncome();
  const unalloc  = unallocatedMoney();
  const uBanner  = document.getElementById('budget-unallocated');
  if (uBanner) {
    if (inc > 0) {
      uBanner.style.display = 'block';
      uBanner.innerHTML = unalloc > 0
        ? `💡 <strong>₱${unalloc.toLocaleString()}</strong> of your income is not allocated to any budget category or savings goal this month.`
        : `✅ All of your income is fully allocated.`;
      uBanner.style.background   = unalloc > 0 ? 'var(--warn2)'  : 'var(--accent3)';
      uBanner.style.borderColor  = unalloc > 0 ? 'var(--warn)'   : 'var(--accent)';
      uBanner.style.color        = unalloc > 0 ? 'var(--warn)'   : 'var(--text)';
    } else {
      uBanner.style.display = 'none';
    }
  }

  const bc=document.getElementById('budget-cards');
  bc.innerHTML='';
  ['Food','Transport','Shopping','Bills','Health','Entertainment','Education','Other Expense'].forEach(cat=>{
    const txnSpent = mt.filter(t=>t.cat===cat).reduce((s,t)=>s+t.amount,0);
    const spent    = txnSpent;
    const limit    = budgets[cat]||0;
    const remaining = Math.max(0, limit - spent);
    const pct      = limit ? Math.min(100, Math.round((spent/limit)*100)) : 0;
    const cls      = pct >= 100 ? 'fill-over' : pct >= 80 ? 'fill-warn' : 'fill-ok';
    const statusTxt = pct >= 100
      ? `<span style="color:var(--danger);font-size:12px;font-weight:600">₱0 left</span>`
      : pct >= 80
        ? `<span style="color:var(--warn);font-size:12px;font-weight:500">Near limit — ₱${remaining.toLocaleString()} left</span>`
        : `<span style="color:var(--accent);font-size:12px">₱${remaining.toLocaleString()} left</span>`;
    bc.innerHTML+=`<div class="budget-setup-card">
      <div class="bsc-header"><div class="bsc-title">${catEmojis[cat]||'📌'} ${cat}</div>${statusTxt}</div>
      <div class="limit-row">
        <input class="limit-input" type="number" id="blimit-${cat}" value="${limit}" placeholder="Set limit">
        <button class="btn-set" onclick="setLimit('${cat}')">Set</button>
      </div>
      <div class="bsc-progress">
        <div class="bsc-stat"><span>Spent: ₱${spent.toLocaleString()}</span><span>Limit: ₱${limit.toLocaleString()}</span></div>
        <div class="bsc-bar-bg"><div class="bsc-bar-fill ${cls}" style="width:${pct}%"></div></div>
      </div></div>`;
  });
}

function setLimit(cat) {
  budgets[cat]=parseFloat(document.getElementById('blimit-'+cat).value)||0;
  renderBudgets();
  renderDashboard();
  showToast(`Budget for ${cat} updated`);
}
