/* =============================================
   app.js
   Theme picker modal, app-shell setup, tab routing.
   ============================================= */

/* ── All available themes ── */
const THEMES = [
  {
    id: 'light',
    name: '✨ Huntrix',
    preview: { bg: '#ebe7f5', bar1: '#8b5cf6', bar2: '#c6a5ec', bar3: '#8b5cf6', label: '#1A1300', labelBg: '#FFFFFF' }
  },
  {
    id: 'cotton-candy',
    name: '🍬 Cotton Candy',
    preview: { bg: '#FFF0F8', bar1: '#E8609A', bar2: '#F5C0DC', bar3: '#FFE4F4', label: '#3A1030', labelBg: '#FFFFFF' }
  },
  {
    id: 'lavender',
    name: '💜 Lavender Dream',
    preview: { bg: '#F8F4FF', bar1: '#8B5CF6', bar2: '#D8CCFF', bar3: '#EDE5FF', label: '#2A1060', labelBg: '#FFFFFF' }
  },
  {
    id: 'mint',
    name: '🌿 Mint Breeze',
    preview: { bg: '#F2FBF6', bar1: '#2E8B57', bar2: '#B8E8CC', bar3: '#E0F5EA', label: '#0A2E1A', labelBg: '#FFFFFF' }
  },
  {
    id: 'peach',
    name: '🍑 Peach Fuzz',
    preview: { bg: '#FFF8F2', bar1: '#E8724A', bar2: '#F5CCAA', bar3: '#FFE0C8', label: '#3A1800', labelBg: '#FFFFFF' }
  },
  {
    id: 'sky',
    name: '🩵 Sky Blue',
    preview: { bg: '#F0F8FF', bar1: '#3A8FE8', bar2: '#B8D8F5', bar3: '#E0F0FF', label: '#0A1E38', labelBg: '#FFFFFF' }
  },
  {
    id: 'lemon',
    name: '🍋 Lemon Drop',
    preview: { bg: '#FFFEF0', bar1: '#C8A800', bar2: '#F0E080', bar3: '#FFF5A8', label: '#2A2000', labelBg: '#FFFFFF' }
  },
  {
    id: 'rose',
    name: '🌸 Rose Quartz',
    preview: { bg: '#FFF5F7', bar1: '#C85070', bar2: '#F5C0CC', bar3: '#FFD6DE', label: '#3A0A14', labelBg: '#FFFFFF' }
  },
  {
    id: 'blush',
    name: '🧸 Blush & Cream',
    preview: { bg: '#FDF8F6', bar1: '#C87050', bar2: '#EED8CC', bar3: '#F5E4DC', label: '#2C1810', labelBg: '#FFFFFF' }
  },
  {
    id: 'charcoal',
    name: '🖤 Charcoal',
    preview: { bg: '#1A1A1A', bar1: '#60A5FA', bar2: '#383838', bar3: '#2E2E2E', label: '#F0F0F0', labelBg: '#242424' }
  },
  {
    id: 'navy',
    name: '🌌 Midnight Navy',
    preview: { bg: '#0A0F1E', bar1: '#6B9FFF', bar2: '#1A2438', bar3: '#243050', label: '#E8EEFF', labelBg: '#111827' }
  },
];

const themeOrder = THEMES.map(t => t.id);

/* ── Render theme cards (used by both modal and theme screen) ── */
function renderThemePicker(containerId) {
  const container = document.getElementById(containerId || 'theme-cards-container');
  if (!container) return;
  container.innerHTML = THEMES.map(t => {
    const p = t.preview;
    const isSelected = currentTheme === t.id;
    return `
      <div class="theme-card${isSelected ? ' selected' : ''}" onclick="pickTheme('${t.id}', this, '${containerId || 'theme-cards-container'}')">
        <div class="theme-preview" style="background:${p.bg}">
          <div class="tp-bar"  style="background:${p.bar1}"></div>
          <div class="tp-bar2" style="background:${p.bar2}"></div>
          <div class="tp-bar3" style="background:${p.bar3}"></div>
          <div class="tp-bar"  style="background:${p.bar1};width:80%;margin-top:4px"></div>
        </div>
        <div class="theme-label" style="background:${p.labelBg};color:${p.label}">
          ${t.name}
          <div class="theme-check">${isSelected ? '✓' : ''}</div>
        </div>
      </div>`;
  }).join('');
}

/* ── Theme functions ── */
function pickTheme(theme, el, containerId) {
  /* Update selection UI */
  const container = document.getElementById(containerId || 'theme-cards-container');
  if (container) {
    container.querySelectorAll('.theme-card').forEach(c => {
      c.classList.remove('selected');
      c.querySelector('.theme-check').textContent = '';
    });
  }
  el.classList.add('selected');
  el.querySelector('.theme-check').textContent = '✓';
  selectedTheme = theme;

  /* Live-preview the theme immediately */
  applyTheme(theme);
}

function applyTheme(theme) {
  currentTheme = theme;
  document.body.removeAttribute('data-theme');
  if (theme !== 'light') document.body.setAttribute('data-theme', theme);
  /* Re-render analytics if open (canvas colours depend on CSS vars) */
  setTimeout(() => {
    if (document.getElementById('panel-analytics') &&
        document.getElementById('panel-analytics').classList.contains('active'))
      renderAnalytics();
  }, 80);
}

/* ── Theme modal (opened from sidebar "Theme" button) ── */
function openThemeModal() {
  renderThemePicker('modal-theme-cards');
  document.getElementById('theme-modal').classList.add('open');
}
function closeThemeModal() {
  document.getElementById('theme-modal').classList.remove('open');
}

/* ── App entry — called directly after login, no theme screen ── */
function enterApp() {
  const app = document.getElementById('app');
  app.style.display = 'flex';
  app.classList.add('visible');

  const initials = currentUser.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('user-avatar').textContent    = initials;
  document.getElementById('user-name-pill').textContent = currentUser.split(' ')[0];

  const hr = new Date().getHours();
  document.getElementById('dash-greeting').textContent =
    `${hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening'}, ${currentUser.split(' ')[0]} 👋`;

  document.getElementById('txn-date').value   = new Date().toISOString().split('T')[0];
  document.getElementById('debt-start').value = new Date().toISOString().split('T')[0];

  renderAll();
}

/* ── Tab routing ── */
const tabTitles = {
  dashboard:    'Dashboard',
  transactions: 'Transactions',
  budget:       'Budget Planner',
  savings:      'Savings Goals',
  debt:         'Debt Manager',
  others:       'Others',
  analytics:    'Analytics',
  feedback:     'Feedback',
};

function switchTab(tab, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
  const tt = document.getElementById('topbar-title');
  if (tt) tt.textContent = tabTitles[tab] || tab;
  if (tab === 'analytics')  renderAnalytics();
  if (tab === 'dashboard')  renderDashboard();
  if (tab === 'debt')       renderDebts();
  if (tab === 'others')     renderOthers();
}

function renderAll() {
  renderDashboard();
  renderTransactions();
  renderBudgets();
  renderGoals();
  renderDebts();
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}
