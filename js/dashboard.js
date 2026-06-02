/* =============================================
   dashboard.js  —  Dashboard panel
   ============================================= */

function renderDashboard() {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();

  /* ── Monthly figures ── */
  const mt      = transactions.filter(t => { const d=new Date(t.date); return d.getMonth()===m && d.getFullYear()===y; });
  const income  = mt.filter(t=>t.type==='income') .reduce((s,t)=>s+t.amount,0);
  const expense = mt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
  const bal     = income - expense;

  /* ── Annual figures ── */
  const yt     = transactions.filter(t=>new Date(t.date).getFullYear()===y);
  const yInc   = yt.filter(t=>t.type==='income') .reduce((s,t)=>s+t.amount,0);
  const yExp   = yt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);

  /* ── Daily average this month ── */
  const daysPassed = now.getDate();
  const dailyAvg   = daysPassed ? Math.round(expense / daysPassed) : 0;

  /* ── Debt ── */
  const totalDebt = debts.reduce((s,d)=>s+Math.max(0,d.total-d.paid),0);

  /* ── Summary cards ── */
  document.getElementById('dash-income').textContent  = '₱'+income.toLocaleString();
  document.getElementById('dash-income-annual').textContent = 'Annual: ₱'+yInc.toLocaleString();

  document.getElementById('dash-expense').textContent = '₱'+expense.toLocaleString();
  document.getElementById('dash-expense-daily').textContent  = 'Daily avg: ₱'+dailyAvg.toLocaleString();
  document.getElementById('dash-expense-annual').textContent = 'Annual: ₱'+yExp.toLocaleString();

  const balEl = document.getElementById('dash-balance');
  balEl.textContent   = (bal>=0?'₱':'-₱')+Math.abs(bal).toLocaleString();
  balEl.style.color   = bal>=0?'var(--accent)':'var(--danger)';
  document.getElementById('dash-balance-annual').textContent = 'Annual net: ₱'+(yInc-yExp).toLocaleString();

  document.getElementById('dash-debt').textContent = '₱'+totalDebt.toLocaleString();

  /* ── Unallocated banner ── */
  const unallocated = unallocatedMoney();
  const uBanner = document.getElementById('dash-unallocated');
  if (uBanner) {
    uBanner.style.display = 'block';
    if (income > 0) {
      uBanner.innerHTML = unallocated > 0
        ? `💡 You have <strong>₱${unallocated.toLocaleString()}</strong> not yet allocated to any budget or savings goal.
           <a href="#" onclick="switchTab('budget',document.querySelectorAll('.tab-btn')[2]);return false;"
              style="color:var(--accent);font-weight:600;text-decoration:underline;margin-left:4px">Set up budgets →</a>`
        : `✅ All your income is fully allocated across budgets and savings goals.`;
      uBanner.style.background   = unallocated > 0 ? 'var(--warn2)'   : 'var(--accent3)';
      uBanner.style.borderColor  = unallocated > 0 ? 'var(--warn)'    : 'var(--accent)';
      uBanner.style.color        = unallocated > 0 ? 'var(--warn)'    : 'var(--text)';
      uBanner.style.border       = '1px solid';
    } else {
      uBanner.innerHTML = '💡 Add an income transaction to start tracking your allocation.';
      uBanner.style.background  = 'var(--bg3)';
      uBanner.style.borderColor = 'var(--border)';
      uBanner.style.color       = 'var(--text2)';
      uBanner.style.border      = '1px solid var(--border)';
    }
  }

  /* ── Bar chart (last 6 months) ── */
  const chart = document.getElementById('dash-chart');
  chart.innerHTML = '';
  const months = [];
  for (let i=5;i>=0;i--) { const d=new Date(y,m-i,1); months.push({label:d.toLocaleString('default',{month:'short'}),m:d.getMonth(),y:d.getFullYear()}); }
  const maxV = Math.max(...months.map(mo=>{
    const t2=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===mo.m&&d.getFullYear()===mo.y;});
    return Math.max(t2.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0), t2.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0));
  }),1);
  months.forEach(mo=>{
    const t2=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===mo.m&&d.getFullYear()===mo.y;});
    const inc=t2.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const exp=t2.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    chart.innerHTML+=`<div class="bar-wrap">
      <div style="display:flex;gap:3px;align-items:flex-end;height:130px">
        <div class="bar-col bar-income"  style="width:18px;height:${Math.round((inc/maxV)*130)||4}px" data-val="₱${inc.toLocaleString()}"></div>
        <div class="bar-col bar-expense" style="width:18px;height:${Math.round((exp/maxV)*130)||4}px" data-val="₱${exp.toLocaleString()}"></div>
      </div>
      <div class="bar-label">${mo.label}</div></div>`;
  });

  /* ── Budget status ── */
  const bl = document.getElementById('dash-budgets');
  bl.innerHTML = '';
  ['Food','Transport','Bills','Entertainment'].forEach(cat=>{
    const spent = mt.filter(t=>t.type==='expense'&&t.cat===cat).reduce((s,t)=>s+t.amount,0);
    const limit = budgets[cat]||0;
    const pct   = limit?Math.min(100,Math.round((spent/limit)*100)):0;
    const cls   = pct>=100?'fill-over':pct>=80?'fill-warn':'fill-ok';
    bl.innerHTML+=`<div class="budget-item">
      <div class="budget-row"><div class="budget-name">${catEmojis[cat]} ${cat}</div>
      <div class="budget-amounts">₱${spent.toLocaleString()} / ₱${limit.toLocaleString()}</div></div>
      <div class="budget-bar-bg"><div class="budget-bar-fill ${cls}" style="width:${pct}%"></div></div></div>`;
  });

  /* ── Recent transactions (all, sorted by date desc) ── */
  const recent = document.getElementById('recent-txns');
  recent.innerHTML = '';
  const last8 = [...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);
  if (!last8.length) {
    recent.innerHTML='<div style="text-align:center;padding:28px;color:var(--text3);font-size:14px">No transactions yet. Add your first one!</div>';
    return;
  }
  last8.forEach(t=>{
    recent.innerHTML+=`<div class="txn-item">
      <div class="txn-icon">${catEmojis[t.cat]||'📌'}</div>
      <div class="txn-info"><div class="txn-name">${t.desc}</div><div class="txn-cat">${t.cat}</div></div>
      <div>
        <div class="txn-amount txn-${t.type}">${t.type==='income'?'+':'-'}₱${t.amount.toLocaleString()}</div>
        <div class="txn-date">${new Date(t.date).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</div>
      </div></div>`;
  });
}

/* ── Modal: analytics drill-down ── */
function openCardModal(type) {
  const now=new Date(), m=now.getMonth(), y=now.getFullYear();
  const mt=transactions.filter(t=>{const d=new Date(t.date);return d.getMonth()===m&&d.getFullYear()===y;});
  const yt=transactions.filter(t=>new Date(t.date).getFullYear()===y);
  let title='', html='';

  if (type==='income') {
    const mInc=mt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const yInc=yt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
    const rows=mt.filter(t=>t.type==='income').sort((a,b)=>b.amount-a.amount);
    title='💜 Income Summary';
    html=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="debt-meta-item"><div class="debt-meta-label">This month</div><div class="debt-meta-value" style="color:var(--accent);font-size:20px">₱${mInc.toLocaleString()}</div></div>
      <div class="debt-meta-item"><div class="debt-meta-label">This year</div><div class="debt-meta-value" style="color:var(--accent);font-size:20px">₱${yInc.toLocaleString()}</div></div>
    </div>
    <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:10px">Monthly income sources</div>
    ${rows.length?rows.map(t=>`<div class="txn-item" style="margin-bottom:8px">
      <div class="txn-icon">${catEmojis[t.cat]||'📌'}</div>
      <div class="txn-info"><div class="txn-name">${t.desc}</div><div class="txn-cat">${new Date(t.date).toLocaleDateString('en-PH',{month:'short',day:'numeric'})}</div></div>
      <div class="txn-amount txn-income">+₱${t.amount.toLocaleString()}</div></div>`).join('')
    :'<div style="color:var(--text3);text-align:center;padding:20px">No income this month</div>'}`;
  }

  else if (type==='expense') {
    const mExp=mt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const yExp=yt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    const daysPassed=now.getDate();
    const daily=daysPassed?Math.round(mExp/daysPassed):0;
    const catTotals={};
    mt.filter(t=>t.type==='expense').forEach(t=>{catTotals[t.cat]=(catTotals[t.cat]||0)+t.amount;});
    title='💸 Expense Summary';
    html=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
      <div class="debt-meta-item"><div class="debt-meta-label">Daily avg</div><div class="debt-meta-value" style="color:var(--danger)">₱${daily.toLocaleString()}</div></div>
      <div class="debt-meta-item"><div class="debt-meta-label">This month</div><div class="debt-meta-value" style="color:var(--danger)">₱${mExp.toLocaleString()}</div></div>
      <div class="debt-meta-item"><div class="debt-meta-label">This year</div><div class="debt-meta-value" style="color:var(--danger)">₱${yExp.toLocaleString()}</div></div>
    </div>
    <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:10px">By category</div>
    ${Object.entries(catTotals).sort((a,b)=>b[1]-a[1]).map(([cat,amt])=>{
      const pct=mExp?Math.round((amt/mExp)*100):0;
      return `<div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
          <span>${catEmojis[cat]||'📌'} ${cat}</span><span style="font-weight:600">₱${amt.toLocaleString()} (${pct}%)</span></div>
        <div class="bsc-bar-bg"><div class="bsc-bar-fill fill-over" style="width:${pct}%;background:var(--danger)"></div></div></div>`;
    }).join('')}`;
  }

  else if (type==='balance') {
    const rows=[];
    for(let i=5;i>=0;i--){
      const d=new Date(y,m-i,1);
      const label=d.toLocaleString('default',{month:'long',year:'numeric'});
      const t2=transactions.filter(t=>{const dd=new Date(t.date);return dd.getMonth()===d.getMonth()&&dd.getFullYear()===d.getFullYear();});
      const inc=t2.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0);
      const exp=t2.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
      rows.push({label,inc,exp,net:inc-exp});
    }
    const yNet=yt.filter(t=>t.type==='income').reduce((s,t)=>s+t.amount,0)-yt.filter(t=>t.type==='expense').reduce((s,t)=>s+t.amount,0);
    title='📈 Net Balance Summary';
    html=`<div class="debt-meta-item" style="margin-bottom:20px"><div class="debt-meta-label">Annual net balance</div>
      <div class="debt-meta-value" style="font-size:22px;color:${yNet>=0?'var(--accent)':'var(--danger)'}">
        ${yNet>=0?'₱':'-₱'}${Math.abs(yNet).toLocaleString()}</div></div>
    <div style="font-size:13px;font-weight:600;color:var(--text2);margin-bottom:12px">Monthly breakdown</div>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr>
        <th style="text-align:left;padding:8px 12px;font-size:12px;color:var(--text3);border-bottom:1px solid var(--border)">Month</th>
        <th style="text-align:right;padding:8px 12px;font-size:12px;color:var(--text3);border-bottom:1px solid var(--border)">Income</th>
        <th style="text-align:right;padding:8px 12px;font-size:12px;color:var(--text3);border-bottom:1px solid var(--border)">Expenses</th>
        <th style="text-align:right;padding:8px 12px;font-size:12px;color:var(--text3);border-bottom:1px solid var(--border)">Net</th>
      </tr></thead><tbody>
      ${rows.map(r=>`<tr>
        <td style="padding:10px 12px;font-size:13px;border-bottom:1px solid var(--border)">${r.label}</td>
        <td style="padding:10px 12px;font-size:13px;text-align:right;color:var(--accent);border-bottom:1px solid var(--border)">+₱${r.inc.toLocaleString()}</td>
        <td style="padding:10px 12px;font-size:13px;text-align:right;color:var(--danger);border-bottom:1px solid var(--border)">-₱${r.exp.toLocaleString()}</td>
        <td style="padding:10px 12px;font-size:13px;text-align:right;font-weight:600;color:${r.net>=0?'var(--accent)':'var(--danger)'};border-bottom:1px solid var(--border)">
          ${r.net>=0?'+':'-'}₱${Math.abs(r.net).toLocaleString()}</td>
      </tr>`).join('')}
      </tbody></table>`;
  }

  document.getElementById('card-modal-title').textContent = title;
  document.getElementById('card-modal-body').innerHTML = html;
  document.getElementById('card-modal').classList.add('open');
}
function closeCardModal() { document.getElementById('card-modal').classList.remove('open'); }
