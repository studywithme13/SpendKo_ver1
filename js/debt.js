/* =============================================
   debt.js  —  Debt Manager panel
   ============================================= */

function openDebtModal()  { document.getElementById('debt-modal').classList.add('open');    }
function closeDebtModal() { document.getElementById('debt-modal').classList.remove('open'); }

function saveDebt() {
  const name    = document.getElementById('debt-name').value.trim();
  const type    = document.getElementById('debt-type').value;
  const total   = parseFloat(document.getElementById('debt-total').value)||0;
  const paidInit= parseFloat(document.getElementById('debt-paid-init').value)||0;
  const interest= parseFloat(document.getElementById('debt-interest').value)||0;
  const monthly = parseFloat(document.getElementById('debt-monthly').value)||0;
  const start   = document.getElementById('debt-start').value;
  const endDate = document.getElementById('debt-end').value;
  const due     = parseInt(document.getElementById('debt-due-day').value)||0;
  const notes   = document.getElementById('debt-notes').value.trim();
  if (!name)           { showToast('Please enter a debt name');    return; }
  if (!total||total<=0){ showToast('Please enter the total amount'); return; }
  debts.push({ id:nextId++, name, type, total, paid:paidInit, interest, monthly, start, endDate, due, notes, payments:[] });
  closeDebtModal();
  ['debt-name','debt-total','debt-paid-init','debt-interest','debt-monthly','debt-start','debt-end','debt-due-day','debt-notes']
    .forEach(id=>{ const el=document.getElementById(id); if(el) el.value=el.type==='number'?'0':''; });
  document.getElementById('debt-start').value=new Date().toISOString().split('T')[0];
  renderDebts(); renderDashboard();
  showToast('Debt added!');
}

function renderDebts() {
  const container=document.getElementById('debt-cards-container');
  const today=new Date(); today.setHours(0,0,0,0);

  const totalOwed =debts.reduce((s,d)=>s+Math.max(0,d.total-d.paid),0);
  const totalPaid =debts.reduce((s,d)=>s+d.paid,0);
  const active    =debts.filter(d=>d.paid<d.total).length;
  const paidOff   =debts.filter(d=>d.paid>=d.total).length;

  document.getElementById('debt-total-owed').textContent   ='₱'+totalOwed.toLocaleString();
  document.getElementById('debt-total-paid').textContent   ='₱'+totalPaid.toLocaleString();
  document.getElementById('debt-active-count').textContent =active;
  document.getElementById('debt-paid-count').textContent   =paidOff;

  /* ── Due reminders ── */
  const reminders=[];
  debts.forEach(d=>{
    if (d.paid>=d.total) return;
    if (!d.due) return;
    /* d.due = day of month for monthly payment */
    const dueDay=parseInt(d.due)||0;
    if (!dueDay) return;
    const thisMonthDue=new Date(today.getFullYear(),today.getMonth(),dueDay);
    const diff=Math.round((thisMonthDue-today)/(1000*60*60*24));
    if (diff<0)       reminders.push({name:d.name,status:'overdue',   diff:Math.abs(diff)});
    else if (diff===0)reminders.push({name:d.name,status:'due-today', diff:0});
    else if (diff<=7) reminders.push({name:d.name,status:'due-soon',  diff});
  });
  const reminderEl=document.getElementById('debt-reminders');
  if (reminderEl) {
    if (reminders.length) {
      reminderEl.style.display='block';
      reminderEl.innerHTML=reminders.map(r=>{
        const icon=r.status==='overdue'?'🔴':r.status==='due-today'?'🟠':'🟡';
        const msg =r.status==='overdue'  ?`<strong>${r.name}</strong> payment is <strong>${r.diff} day${r.diff!==1?'s':''} overdue</strong>.`
                  :r.status==='due-today'?`<strong>${r.name}</strong> payment is <strong>due today</strong>.`
                  :`<strong>${r.name}</strong> payment is due in <strong>${r.diff} day${r.diff!==1?'s':''}</strong>.`;
        return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);font-size:13px">
          <span>${icon}</span><span>${msg}</span></div>`;
      }).join('');
    } else {
      reminderEl.style.display='none';
    }
  }

  container.innerHTML='';
  if (!debts.length) {
    container.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:48px;color:var(--text3);
      background:var(--card);border:1px solid var(--border);border-radius:var(--radius)">
      <div style="font-size:40px;margin-bottom:12px">🎉</div>
      <div style="font-weight:600;margin-bottom:6px">No debts recorded</div>
      <div style="font-size:14px">Add a loan or debt to start tracking it here.</div></div>`;
    return;
  }

  debts.forEach(d=>{
    const remaining  =Math.max(0,d.total-d.paid);
    const pct        =Math.min(100,Math.round((d.paid/d.total)*100));
    const endDate    =d.endDate?new Date(d.endDate):null;
    const isOverdue  =endDate&&endDate<today&&remaining>0;
    const isPaidOff  =remaining<=0;
    const statusClass=isPaidOff?'status-paid':isOverdue?'status-overdue':'status-active';
    const statusText =isPaidOff?'✅ Paid off':isOverdue?'⚠️ Overdue':'🔴 Active';
    const mthsLeft   =d.monthly>0?Math.ceil(remaining/d.monthly):null;

    /* Due day label */
    const dueLbl = d.due
      ? `Every ${d.due}${['th','st','nd','rd'][Math.min(d.due%10,3)]||'th'} of the month`
      : '—';

    /* End date label */
    const endLbl = endDate
      ? endDate.toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})
      : '—';

    const logsHtml=d.payments.slice(-3).reverse().map(p=>
      `<div class="log-item">
        <span>${new Date(p.date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span>
        <span style="color:var(--accent);font-weight:500">-₱${p.amount.toLocaleString()}</span></div>`
    ).join('');

    container.innerHTML+=`<div class="debt-card">
      <div class="debt-card-header">
        <div>
          <div class="debt-card-title">${debtTypeEmojis[d.type]||'💳'} ${d.name}</div>
          <div class="debt-card-type">${d.type}</div>
        </div>
        <span class="debt-status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="debt-amount-row">
        <div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:2px">Remaining</div>
          <div class="debt-remaining">${isPaidOff?'₱0':'₱'+remaining.toLocaleString()}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:12px;color:var(--text3);margin-bottom:2px">Original total</div>
          <div class="debt-original">₱${d.total.toLocaleString()}</div>
        </div>
      </div>
      <div class="debt-bar-bg"><div class="debt-bar-fill" style="width:${pct}%"></div></div>
      <div style="font-size:12px;color:var(--text3);margin-bottom:12px">${pct}% paid off</div>
      <div class="debt-meta">
        <div class="debt-meta-item"><div class="debt-meta-label">Interest rate</div><div class="debt-meta-value">${d.interest}% p.a.</div></div>
        <div class="debt-meta-item"><div class="debt-meta-label">Monthly payment</div><div class="debt-meta-value">₱${d.monthly.toLocaleString()}</div></div>
        <div class="debt-meta-item"><div class="debt-meta-label">Total amount paid</div><div class="debt-meta-value" style="color:var(--accent)">₱${d.paid.toLocaleString()}</div></div>
        <div class="debt-meta-item"><div class="debt-meta-label">Due day (monthly)</div><div class="debt-meta-value">${dueLbl}</div></div>
        <div class="debt-meta-item"><div class="debt-meta-label">Loan end date</div><div class="debt-meta-value">${endLbl}</div></div>
        <div class="debt-meta-item"><div class="debt-meta-label">Months left (est.)</div><div class="debt-meta-value">${isPaidOff?'Done!':mthsLeft?mthsLeft+' mos':'—'}</div></div>
      </div>
      ${d.notes?`<div style="font-size:13px;color:var(--text2);background:var(--bg3);padding:8px 12px;border-radius:var(--radius-sm);margin-bottom:14px">📝 ${d.notes}</div>`:''}
      <div class="debt-actions">
        ${!isPaidOff
          ?`<button class="btn-pay" onclick="makePayment(${d.id})">💳 Make payment</button>`
          :'<div style="flex:1;text-align:center;font-size:13px;color:var(--accent);font-weight:600;padding:9px">Fully paid off! 🎉</div>'}
        <button class="btn-debt-del" onclick="deleteDebt(${d.id})">🗑</button>
      </div>
      ${d.payments.length?`<div class="debt-payment-log"><div class="debt-payment-log-title">Recent payments</div>${logsHtml}</div>`:''}</div>`;
  });
}

function makePayment(id) {
  const d=debts.find(d=>d.id===id);
  if (!d) return;
  const remaining=d.total-d.paid;
  const suggested=d.monthly||remaining;
  const amt=parseFloat(prompt(`Payment for "${d.name}"\nRemaining: ₱${remaining.toLocaleString()}\nSuggested: ₱${suggested.toLocaleString()}\n\nAmount to pay (₱):`));
  if (!amt||amt<=0) return;
  const actual=Math.min(amt,remaining);
  d.paid+=actual;
  d.payments.push({ date:new Date().toISOString().split('T')[0], amount:actual });
  renderDebts(); renderDashboard();
  if (d.paid>=d.total) showToast(`🎉 "${d.name}" is fully paid off!`);
  else showToast(`Payment of ₱${actual.toLocaleString()} recorded!`);
}

function deleteDebt(id) {
  debts=debts.filter(d=>d.id!==id);
  renderDebts(); renderDashboard();
  showToast('Debt removed.');
}
