/* =============================================
   savings.js  —  Savings Goals panel
   ============================================= */

function renderGoals() {
  /* Unallocated banner — same formula as dashboard & budget */
  const inc     = monthlyIncome();
  const unalloc = unallocatedMoney();
  const uBanner = document.getElementById('savings-unallocated');
  if (uBanner) {
    if (inc > 0) {
      uBanner.style.display = 'block';
      uBanner.innerHTML = unalloc > 0
        ? `💡 <strong>₱${unalloc.toLocaleString()}</strong> of your income is not yet allocated to any budget or savings goal.`
        : `✅ All of your income is fully allocated.`;
      uBanner.style.background  = unalloc > 0 ? 'var(--warn2)'  : 'var(--accent3)';
      uBanner.style.borderColor = unalloc > 0 ? 'var(--warn)'   : 'var(--accent)';
      uBanner.style.color       = unalloc > 0 ? 'var(--warn)'   : 'var(--text)';
    } else {
      uBanner.style.display = 'none';
    }
  }

  const grid=document.getElementById('goals-grid');
  grid.innerHTML='';
  goals.forEach(g=>{
    const pct  = Math.min(100,Math.round((g.saved/g.target)*100));
    const r=54, circ=2*Math.PI*r, dash=circ*(pct/100);
    /* Recent fund logs */
    const logsHtml = (g.logs||[]).slice(-3).reverse().map(l=>
      `<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text2);padding:4px 0;border-bottom:1px solid var(--border)">
        <span>${new Date(l.date).toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}</span>
        <span style="color:var(--accent);font-weight:500">+₱${l.amount.toLocaleString()}</span></div>`
    ).join('');
    grid.innerHTML+=`<div class="goal-card">
      <div class="goal-header">
        <div class="goal-emoji">${g.emoji}</div>
        <div class="goal-info"><div class="goal-name">${g.name}</div><div class="goal-meta">${pct}% reached</div></div>
        <div class="goal-progress-circle">
          <svg width="80" height="80" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--bg3)" stroke-width="10"/>
            <circle cx="60" cy="60" r="${r}" fill="none" stroke="var(--accent2)" stroke-width="10"
              stroke-dasharray="${dash} ${circ}" stroke-linecap="round" transform="rotate(-90 60 60)"/>
          </svg>
          <div class="pct-text">${pct}%</div>
        </div>
      </div>
      <div class="goal-amounts"><span>Saved: ₱${g.saved.toLocaleString()}</span><span>Target: ₱${g.target.toLocaleString()}</span></div>
      <div class="goal-bar-bg"><div class="goal-bar-fill" style="width:${pct}%"></div></div>
      ${logsHtml?`<div style="margin-top:10px;font-size:12px;font-weight:600;color:var(--text3);margin-bottom:4px">Recent additions</div>${logsHtml}`:''}
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="goal-add-btn" onclick="addToGoal(${g.id})" style="flex:1">+ Add funds</button>
        <button class="goal-add-btn" onclick="deleteGoal(${g.id})" style="background:var(--danger2);color:var(--danger)">✕</button>
      </div></div>`;
  });
  grid.innerHTML+=`<div class="add-goal-card" onclick="document.getElementById('goal-modal').classList.add('open')">
    <div class="plus">＋</div><span>Add new goal</span></div>`;
}

function closeGoalModal() { document.getElementById('goal-modal').classList.remove('open'); }

function saveGoal() {
  const name  = document.getElementById('goal-name').value.trim();
  const target= parseFloat(document.getElementById('goal-target').value)||0;
  const saved = parseFloat(document.getElementById('goal-saved').value)||0;
  const emoji = document.getElementById('goal-emoji').value;
  if (!name)  { showToast('Please enter a goal name');    return; }
  if (!target){ showToast('Please enter a target amount'); return; }
  goals.push({ id:nextId++, name, emoji, target, saved, logs:[] });
  closeGoalModal();
  document.getElementById('goal-name').value='';
  document.getElementById('goal-target').value='';
  document.getElementById('goal-saved').value='';
  renderGoals();
  renderDashboard();
  showToast('Savings goal added!');
}

function addToGoal(id) {
  const g = goals.find(g=>g.id===id);
  if (!g) return;
  const goalRemaining = g.target - g.saved;
  const unalloc       = unallocatedMoney();

  if (unalloc <= 0) {
    showToast('No unallocated money available to add to savings.');
    alert(
      `🚫 No unallocated money remaining!\n\n` +
      `Your entire income has already been allocated to budgets and savings.\n\n` +
      `To add funds here, either:\n` +
      `• Add more income in the Transactions tab, or\n` +
      `• Reduce a budget limit in the Budget tab.`
    );
    return;
  }

  const amtStr = prompt(
    `Add funds to "${g.name}"\n` +
    `─────────────────────────\n` +
    `Remaining to goal:   ₱${goalRemaining.toLocaleString()}\n` +
    `Available to use:    ₱${unalloc.toLocaleString()}\n` +
    `─────────────────────────\n` +
    `Enter amount (max ₱${Math.min(goalRemaining, unalloc).toLocaleString()}):`
  );

  const amt = parseFloat(amtStr);
  if (!amt || amt <= 0) return;

  /* Hard block — cannot exceed unallocated money */
  if (amt > unalloc) {
    showToast(`Only ₱${unalloc.toLocaleString()} available. Please try again.`);
    alert(
      `🚫 Not enough unallocated money!\n\n` +
      `You tried to add: ₱${amt.toLocaleString()}\n` +
      `Available:        ₱${unalloc.toLocaleString()}\n\n` +
      `Please enter an amount of ₱${unalloc.toLocaleString()} or less.`
    );
    return;
  }

  /* Cap at goal remaining too */
  if (amt > goalRemaining) {
    showToast(`Goal only needs ₱${goalRemaining.toLocaleString()} more. Capped automatically.`);
  }
  const actual = Math.min(amt, goalRemaining);

  /* Update goal */
  g.saved += actual;
  if (!g.logs) g.logs = [];
  g.logs.push({ date: new Date().toISOString().split('T')[0], amount: actual });

  /* Record as Savings expense — deducts from unallocatedMoney() */
  transactions.push({
    id: nextId++,
    desc: `Savings deposit: ${g.name}`,
    amount: actual,
    type: 'expense',
    cat: 'Savings',
    date: new Date().toISOString().split('T')[0]
  });

  renderGoals();
  renderAll();
  showToast(`₱${actual.toLocaleString()} moved to "${g.name}"`);
}

function deleteGoal(id) {
  goals=goals.filter(g=>g.id!==id);
  renderGoals();
  renderDashboard();
  showToast('Goal removed');
}
