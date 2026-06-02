/* =============================================
   analytics.js
   Renders the Analytics panel:
   - Donut chart (spending by category)
   - Monthly trend list
   - Financial insights
   ============================================= */

function renderAnalytics() {
  const now = new Date(), m = now.getMonth(), y = now.getFullYear();
  const monthExp = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === m && d.getFullYear() === y && t.type === 'expense';
  });

  /* ---- Donut chart ---- */
  const catTotals = {};
  monthExp.forEach(t => { catTotals[t.cat] = (catTotals[t.cat] || 0) + t.amount; });
  const total = Object.values(catTotals).reduce((s, v) => s + v, 0) || 1;
  const cats  = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  const canvas = document.getElementById('donut-canvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 130, 130);

  let start = 0;
  cats.forEach(([, val], i) => {
    const s = (val / total) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(65, 65);
    ctx.arc(65, 65, 52, start, start + s);
    ctx.closePath();
    ctx.fillStyle = catColors[i % catColors.length];
    ctx.fill();
    start += s;
  });

  // Donut hole
  const cardBg = getComputedStyle(document.body).getPropertyValue('--card').trim() || '#fff';
  ctx.beginPath();
  ctx.arc(65, 65, 28, 0, 2 * Math.PI);
  ctx.fillStyle = cardBg || '#ffffff';
  ctx.fill();

  // Legend
  const legend = document.getElementById('donut-legend');
  legend.innerHTML = '';
  cats.slice(0, 6).forEach(([cat, val], i) => {
    const pct = Math.round((val / total) * 100);
    legend.innerHTML += `
      <div class="legend-item">
        <div class="legend-dot" style="background:${catColors[i % catColors.length]}"></div>
        ${catEmojis[cat] || ''} ${cat}
        <div class="legend-pct">${pct}%</div>
      </div>`;
  });
  if (!cats.length) legend.innerHTML = '<div style="color:var(--text3);font-size:14px">No expenses this month</div>';

  /* ---- Monthly trend (last 3 months) ---- */
  const trendList = document.getElementById('trend-list');
  trendList.innerHTML = '';
  for (let i = 2; i >= 0; i--) {
    const d     = new Date(y, m - i, 1);
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    const t2    = transactions.filter(t => {
      const dd = new Date(t.date);
      return dd.getMonth() === d.getMonth() && dd.getFullYear() === d.getFullYear();
    });
    const inc = t2.filter(t => t.type === 'income') .reduce((s, t) => s + t.amount, 0);
    const exp = t2.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    trendList.innerHTML += `
      <div class="trend-item">
        <div class="trend-name">${label}</div>
        <div style="text-align:right">
          <div style="font-size:13px;color:var(--accent)">+₱${inc.toLocaleString()}</div>
          <div style="font-size:13px;color:var(--danger)">-₱${exp.toLocaleString()}</div>
        </div>
      </div>`;
  }

  /* ---- Financial insights ---- */
  const insights = document.getElementById('insights-list');
  const msgs = [];
  if (cats[0]) msgs.push({ icon: '📊', text: `Highest spending: <strong>${cats[0][0]}</strong> at ₱${cats[0][1].toLocaleString()} this month.` });

  const inc2 = transactions.filter(t => { const d = new Date(t.date); return d.getMonth() === m && d.getFullYear() === y && t.type === 'income'; }).reduce((s, t) => s + t.amount, 0);
  const exp2 = monthExp.reduce((s, t) => s + t.amount, 0);
  if (inc2 > 0) {
    const r = Math.round((exp2 / inc2) * 100);
    msgs.push({ icon: '💡', text: `You've spent <strong>${r}%</strong> of your income. ${r > 80 ? 'Consider cutting expenses.' : 'Great spending discipline!'}` });
  }

  const totalDebt = debts.reduce((s, d) => s + Math.max(0, d.total - d.paid), 0);
  if (totalDebt > 0) msgs.push({ icon: '🏦', text: `You still have <strong>₱${totalDebt.toLocaleString()}</strong> in outstanding debts. Prioritize high-interest debts first.` });

  const overB = Object.entries(budgets).filter(([cat, limit]) => {
    const s = monthExp.filter(t => t.cat === cat).reduce((a, t) => a + t.amount, 0);
    return limit && s > limit;
  });
  msgs.push(overB.length
    ? { icon: '⚠️', text: `Over budget in: <strong>${overB.map(e => e[0]).join(', ')}</strong>. Review your spending.` }
    : { icon: '✅', text: "You're within budget for all categories this month!" }
  );

  insights.innerHTML = msgs.map(ms =>
    `<div style="display:flex;gap:12px;padding:12px 14px;background:var(--bg3);border-radius:var(--radius-sm)">
       <span style="font-size:20px">${ms.icon}</span>
       <div style="font-size:14px;color:var(--text);line-height:1.6">${ms.text}</div>
     </div>`
  ).join('');
}